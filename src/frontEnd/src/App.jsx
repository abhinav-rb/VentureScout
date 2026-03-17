import { useState, useEffect } from 'react'

// Define our Kanban columns
const COLUMNS = ['New', 'Outreach', 'Due Diligence', 'Pass', 'Invest'];

function App() {
  const [deals, setDeals] = useState([])
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [urlInput, setUrlInput] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  
  // State for our Pop-up Modal
  const [selectedDeal, setSelectedDeal] = useState(null)

  const fetchDeals = () => {
    fetch('/api/deals')
      .then(response => {
        if (!response.ok) throw new Error('Failed to connect to backend')
        return response.json()
      })
      .then(data => {
        if (data.success) {
          // Parse the JSON string of tags back into a JavaScript array
          const parsedDeals = data.deals.map(deal => ({
            ...deal,
            industry_tags: typeof deal.industry_tags === 'string' 
              ? JSON.parse(deal.industry_tags) 
              : deal.industry_tags
          }));
          setDeals(parsedDeals)
        } else {
          setError(data.error)
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setIsLoading(false))
  }

  useEffect(() => {
    fetchDeals()
  }, [])

  const handleAnalyze = async (e) => {
    e.preventDefault()
    if (!urlInput.trim()) return

    setIsAnalyzing(true)
    setError(null)

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlInput }),
      })
      
      const data = await response.json()
      if (data.success) {
        setUrlInput("")
        fetchDeals() 
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError("Failed to reach the server.")
    } finally {
      setIsAnalyzing(false)
    }
  }

  // --- DRAG AND DROP LOGIC ---
  
  // 1. When you pick up a card
  const handleDragStart = (e, dealId) => {
    e.dataTransfer.setData("dealId", dealId);
  }

  // 2. When hovering over a column (required to allow dropping)
  const handleDragOver = (e) => {
    e.preventDefault();
  }

  // 3. When you drop the card into a new column
  const handleDrop = async (e, newStatus) => {
    e.preventDefault();
    const dealId = e.dataTransfer.getData("dealId");
    
    // Optimistically update the UI instantly so it feels fast
    setDeals(prevDeals => 
      prevDeals.map(deal => deal.id == dealId ? { ...deal, status: newStatus } : deal)
    );

    // Tell the backend to update the database
    try {
      await fetch(`/api/deals/${dealId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
    } catch (err) {
      console.error("Failed to update status in database", err);
      fetchDeals(); // Revert if it fails
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans text-slate-900">
      <div className="mx-auto max-w-7xl">
        
        {/* Header & Input */}
        <header className="mb-8 flex items-end justify-between border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-800">
              VentureScout <span className="text-blue-600">MVP</span>
            </h1>
            <p className="mt-2 text-sm text-slate-500">Deal Flow CRM & Analyzer</p>
          </div>
          
          <form onSubmit={handleAnalyze} className="flex gap-2 w-full max-w-md">
            <input
              type="url"
              placeholder="https://startup.com"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              disabled={isAnalyzing}
              required
              className="flex-1 rounded-lg border border-slate-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100 text-sm"
            />
            <button
              type="submit"
              disabled={isAnalyzing}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:bg-blue-300 whitespace-nowrap"
            >
              {isAnalyzing ? "Analyzing..." : "Analyze"}
            </button>
          </form>
        </header>
        
        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4 text-sm text-red-700 border border-red-200">
            {error}
          </div>
        )}

        {/* --- THE KANBAN BOARD --- */}
        {isLoading ? (
          <div className="animate-pulse text-slate-400">Loading board...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {COLUMNS.map(column => (
              <div 
                key={column} 
                className="flex flex-col rounded-xl bg-slate-100/50 p-3 border border-slate-200 min-h-[500px]"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, column)}
              >
                <h3 className="mb-3 px-1 text-sm font-bold uppercase tracking-wider text-slate-500">
                  {column} <span className="ml-1 text-xs font-normal bg-slate-200 px-2 py-0.5 rounded-full">{deals.filter(d => d.status === column).length}</span>
                </h3>
                
                <div className="flex flex-col gap-3 flex-1">
                  {deals.filter(deal => deal.status === column).map(deal => (
                    
                    // --- THE DEAL CARD ---
                    <div 
                      key={deal.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, deal.id)}
                      onClick={() => setSelectedDeal(deal)}
                      className="cursor-pointer group relative rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-blue-400 hover:shadow-md"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <img 
                          src={deal.logo_url} 
                          alt="logo" 
                          className="h-8 w-8 rounded-md border border-slate-100 object-cover bg-slate-50"
                          onError={(e) => e.target.src = "https://via.placeholder.com/32?text=?"} // Fallback if Clearbit fails
                        />
                        <h4 className="font-semibold text-slate-800 truncate">{deal.company_name}</h4>
                      </div>
                      
                      <p className="text-xs text-slate-500 line-clamp-3 mb-3">
                        {deal.high_concept_pitch}
                      </p>
                      
                      <div className="flex flex-wrap gap-1">
                        {deal.industry_tags && deal.industry_tags.map((tag, i) => (
                          <span key={i} className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-600">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* --- THE DEEP DIVE MODAL --- */}
        {selectedDeal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden">
              
              <div className="border-b border-slate-100 px-6 py-4 flex justify-between items-center bg-slate-50">
                <div className="flex items-center gap-3">
                   <img src={selectedDeal.logo_url} className="h-10 w-10 rounded-lg border border-slate-200 bg-white" alt="logo" />
                   <div>
                     <h2 className="text-xl font-bold text-slate-800">{selectedDeal.company_name}</h2>
                     <a href={selectedDeal.url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">{selectedDeal.url}</a>
                   </div>
                </div>
                <button 
                  onClick={() => setSelectedDeal(null)}
                  className="rounded-full p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition"
                >
                  ✕
                </button>
              </div>

              <div className="p-6">
                <div className="mb-6">
                  <h3 className="text-sm font-bold uppercase text-slate-400 mb-2 tracking-wider">High Concept Pitch</h3>
                  <p className="text-lg text-slate-800">{selectedDeal.high_concept_pitch}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="rounded-xl bg-green-50/50 border border-green-100 p-4">
                    <h3 className="text-sm font-bold uppercase text-green-700 mb-2 flex items-center gap-2">
                      📈 Bull Case
                    </h3>
                    <p className="text-sm text-slate-700 leading-relaxed">{selectedDeal.bull_case}</p>
                  </div>
                  
                  <div className="rounded-xl bg-red-50/50 border border-red-100 p-4">
                    <h3 className="text-sm font-bold uppercase text-red-700 mb-2 flex items-center gap-2">
                      📉 Bear Case
                    </h3>
                    <p className="text-sm text-slate-700 leading-relaxed">{selectedDeal.bear_case}</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  )
}

export default App
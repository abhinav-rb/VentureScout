import { useState, useEffect } from 'react'

const COLUMNS = ['New', 'Outreach', 'Due Diligence', 'Pass', 'Invest'];

function App() {
  const [deals, setDeals] = useState([])
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [urlInput, setUrlInput] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [selectedDeal, setSelectedDeal] = useState(null)

  const fetchDeals = () => {
    fetch('/api/deals')
      .then(response => {
        if (!response.ok) throw new Error('Failed to connect to backend')
        return response.json()
      })
      .then(data => {
        if (data.success) {
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

  const handleDragStart = (e, dealId) => {
    e.dataTransfer.setData("dealId", dealId);
  }

  const handleDragOver = (e) => {
    e.preventDefault();
  }

  const handleDrop = async (e, newStatus) => {
    e.preventDefault();
    const dealId = e.dataTransfer.getData("dealId");
    
    setDeals(prevDeals => 
      prevDeals.map(deal => deal.id == dealId ? { ...deal, status: newStatus } : deal)
    );

    try {
      await fetch(`/api/deals/${dealId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
    } catch (err) {
      console.error("Failed to update status", err);
      fetchDeals(); 
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-8 font-sans text-zinc-100 selection:bg-green-500/30">
      <div className="mx-auto max-w-7xl">
        
        {/* Header & Input */}
        <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between border-b border-zinc-800 pb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-green-500 animate-pulse"></span>
              VentureScout
            </h1>
            <p className="mt-2 text-sm text-zinc-400">Deal Flow CRM & Analyzer</p>
          </div>
          
          <form onSubmit={handleAnalyze} className="flex gap-2 w-full max-w-md">
            <input
              type="url"
              placeholder="https://startup.com"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              disabled={isAnalyzing}
              required
              className="flex-1 rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2 text-zinc-100 placeholder-zinc-500 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:opacity-50 text-sm"
            />
            <button
              type="submit"
              disabled={isAnalyzing}
              className="rounded-lg bg-green-600 px-5 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-green-500 disabled:bg-zinc-800 disabled:text-zinc-500 whitespace-nowrap"
            >
              {isAnalyzing ? "Analyzing..." : "Analyze"}
            </button>
          </form>
        </header>
        
        {error && (
          <div className="mb-6 rounded-md bg-red-950/50 p-4 text-sm text-red-400 border border-red-900/50">
            {error}
          </div>
        )}

        {/* --- THE KANBAN BOARD --- */}
        {isLoading ? (
          <div className="animate-pulse text-green-500 font-mono text-sm">Loading database records...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {COLUMNS.map(column => (
              <div 
                key={column} 
                className="flex flex-col rounded-xl bg-zinc-900/50 p-3 border border-zinc-800 min-h-[500px]"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, column)}
              >
                <h3 className="mb-3 px-1 text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center justify-between">
                  {column} 
                  <span className="bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-full text-[10px]">
                    {deals.filter(d => d.status === column).length}
                  </span>
                </h3>
                
                <div className="flex flex-col gap-3 flex-1">
                  {deals.filter(deal => deal.status === column).map(deal => (
                    
                    // --- THE DEAL CARD ---
                    <div 
                      key={deal.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, deal.id)}
                      onClick={() => setSelectedDeal(deal)}
                      className="cursor-pointer group relative rounded-lg border border-zinc-800 bg-zinc-900 p-4 shadow-sm transition-all hover:border-green-500 hover:shadow-[0_0_15px_rgba(34,197,94,0.15)]"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        {/* Improved Logo Fetching with Google Favicon Fallback */}
                        <img 
                          src={deal.logo_url} 
                          alt="logo" 
                          className="h-8 w-8 rounded-md border border-zinc-700 object-contain bg-zinc-950 p-0.5"
                          onError={(e) => {
                            e.target.onerror = null; 
                            e.target.src = `https://www.google.com/s2/favicons?domain=${deal.url}&sz=128`
                          }} 
                        />
                        <h4 className="font-semibold text-zinc-100 truncate">{deal.company_name}</h4>
                      </div>
                      
                      <p className="text-xs text-zinc-400 line-clamp-3 mb-4 leading-relaxed">
                        {deal.high_concept_pitch}
                      </p>
                      
                      <div className="flex flex-wrap gap-1.5">
                        {deal.industry_tags && deal.industry_tags.map((tag, i) => (
                          <span key={i} className="rounded bg-green-500/10 border border-green-500/20 px-2 py-0.5 text-[10px] font-medium text-green-400">
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-2xl rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl overflow-hidden">
              
              <div className="border-b border-zinc-800 px-6 py-5 flex justify-between items-center bg-zinc-900/50">
                <div className="flex items-center gap-4">
                   <img 
                      src={selectedDeal.logo_url} 
                      className="h-12 w-12 rounded-lg border border-zinc-700 bg-zinc-950 p-1 object-contain" 
                      alt="logo"
                      onError={(e) => {
                        e.target.onerror = null; 
                        e.target.src = `https://www.google.com/s2/favicons?domain=${selectedDeal.url}&sz=128`
                      }}  
                    />
                   <div>
                     <h2 className="text-xl font-bold text-zinc-100">{selectedDeal.company_name}</h2>
                     <a href={selectedDeal.url} target="_blank" rel="noreferrer" className="text-sm text-green-400 hover:text-green-300 hover:underline transition-colors">
                       {selectedDeal.url}
                     </a>
                   </div>
                </div>
                <button 
                  onClick={() => setSelectedDeal(null)}
                  className="rounded-full p-2 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 transition"
                >
                  ✕
                </button>
              </div>

              <div className="p-6">
                <div className="mb-6 rounded-xl bg-zinc-900 p-5 border border-zinc-800">
                  <h3 className="text-xs font-bold uppercase text-zinc-500 mb-2 tracking-widest">High Concept Pitch</h3>
                  <p className="text-base text-zinc-300 leading-relaxed">{selectedDeal.high_concept_pitch}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-xl bg-green-950/30 border border-green-900/50 p-5">
                    <h3 className="text-sm font-bold uppercase text-green-500 mb-3 flex items-center gap-2">
                      📈 Bull Case
                    </h3>
                    <p className="text-sm text-zinc-400 leading-relaxed">{selectedDeal.bull_case}</p>
                  </div>
                  
                  <div className="rounded-xl bg-red-950/20 border border-red-900/30 p-5">
                    <h3 className="text-sm font-bold uppercase text-red-500 mb-3 flex items-center gap-2">
                      📉 Bear Case
                    </h3>
                    <p className="text-sm text-zinc-400 leading-relaxed">{selectedDeal.bear_case}</p>
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
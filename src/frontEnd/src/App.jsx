import { useState, useEffect } from 'react'

function App() {
  // State for our database records
  const [deals, setDeals] = useState([])
  
  // State for our UI interactions
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(true) // For the initial page load
  const [urlInput, setUrlInput] = useState("") // Holds the text in the search bar
  const [isAnalyzing, setIsAnalyzing] = useState(false) // True when AI is working

  // We moved the fetch logic into its own function so we can call it again later!
  const fetchDeals = () => {
    fetch('/api/deals')
      .then(response => {
        if (!response.ok) throw new Error('Failed to connect to backend')
        return response.json()
      })
      .then(data => {
        if (data.success) {
          setDeals(data.deals)
        } else {
          setError(data.error)
        }
      })
      .catch(err => {
        console.error("Fetch error:", err)
        setError(err.message)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }

  // Run the fetch function when the page first loads
  useEffect(() => {
    fetchDeals()
  }, [])

  // This handles the user clicking "Analyze"
  const handleAnalyze = async (e) => {
    e.preventDefault() // Prevents the page from refreshing
    if (!urlInput.trim()) return // Don't do anything if the box is empty

    setIsAnalyzing(true)
    setError(null)

    try {
      // Send a POST request to our Flask AI route
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: urlInput }),
      })
      
      const data = await response.json()

      if (data.success) {
        // Success! Clear the input box and fetch the updated database records
        setUrlInput("")
        fetchDeals() 
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError("Failed to reach the server. Is Flask running?")
    } finally {
      setIsAnalyzing(false) // Turn off the loading state
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans text-slate-900">
      <div className="mx-auto max-w-5xl">
        
        {/* Header */}
        <header className="mb-8 border-b border-slate-200 pb-4">
          <h1 className="text-3xl font-bold tracking-tight text-slate-800">
            VentureScout <span className="text-blue-600">MVP</span>
          </h1>
          <p className="mt-2 text-sm text-slate-500">Deal Flow CRM & Analyzer</p>
        </header>
        
        {/* Error State */}
        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4 text-sm text-red-700 border border-red-200">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* --- NEW: The Smart Input Bar --- */}
        <div className="mb-8 rounded-xl bg-white p-6 shadow-sm border border-slate-100">
          <form onSubmit={handleAnalyze} className="flex gap-4">
            <input
              type="url"
              placeholder="https://startup-website.com"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              disabled={isAnalyzing}
              required
              className="flex-1 rounded-lg border border-slate-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400"
            />
            <button
              type="submit"
              disabled={isAnalyzing}
              className="rounded-lg bg-blue-600 px-6 py-2 font-semibold text-white transition-colors hover:bg-blue-700 disabled:bg-blue-300"
            >
              {isAnalyzing ? "Analyzing AI..." : "Analyze Startup"}
            </button>
          </form>
        </div>

        {/* Data Display (We will turn this into the Kanban board next) */}
        <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-100">
          <h2 className="mb-4 text-lg font-semibold text-slate-700">Database Records</h2>
          
          {isLoading ? (
            <div className="animate-pulse text-slate-400">Fetching deals from SQLite...</div>
          ) : (
            <pre className="max-h-96 overflow-auto rounded-lg bg-slate-900 p-4 text-xs text-green-400 shadow-inner">
              {deals.length > 0 
                ? JSON.stringify(deals, null, 2) 
                : "// Database connected, but no deals found. Time to scrape!"}
            </pre>
          )}
        </div>

      </div>
    </div>
  )
}

export default App
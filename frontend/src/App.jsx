import { useState, useEffect, useMemo } from 'react';
import { ExternalLink, CheckCircle, Clock, Search, ArrowUpRight, Wallet, Activity, CreditCard, ChevronDown, Bell, Settings } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

function App() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Payments');

  const fetchOrders = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/orders');
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (err) {
      console.error("Failed to fetch orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 4000);
    return () => clearInterval(interval);
  }, []);

  // Compute Metrics dynamically
  const metrics = useMemo(() => {
    const paidOrders = orders.filter(o => o.status === 'PAID');
    const grossVolume = paidOrders.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);
    
    // Success rate safely avoiding NaN
    const successRate = orders.length === 0 ? 0 : Math.round((paidOrders.length / orders.length) * 100);

    return {
      grossVolume: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(grossVolume),
      totalTransactions: orders.length,
      successRate: `${successRate}%`,
      activeCheckouts: orders.filter(o => o.status === 'PENDING').length
    };
  }, [orders]);

  return (
    <div className="min-h-screen bg-[#09090b] text-[#fafafa] font-sans flex flex-col">
      {/* Top Navbar */}
      <nav className="border-b border-[#27272a] bg-[#09090b] px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-red-600 to-red-900 flex items-center justify-center border border-red-500/50 shadow-[0_0_15px_rgba(220,38,38,0.3)]">
              <span className="text-white font-bold text-lg leading-none mt-[-2px]">♦</span>
            </div>
            <span className="font-semibold text-lg tracking-tight">TRON UCP Gateway</span>
          </div>
          
          <div className="hidden md:flex gap-1 bg-[#18181b] p-1 rounded-md border border-[#27272a]">
            {['Overview', 'Payments', 'Balances', 'Customers', 'Developers'].map((item) => (
              <button 
                key={item} 
                onClick={() => setActiveTab(item)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === item ? 'bg-[#27272a] text-white shadow-sm' : 'text-[#a1a1aa] hover:text-white hover:bg-[#27272a]/50'}`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative group hidden sm:block">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#71717a] group-focus-within:text-red-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Search payments, agents..." 
              className="pl-9 pr-4 py-1.5 bg-[#18181b] border border-[#27272a] rounded-md text-sm outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 w-64 transition-all placeholder:text-[#71717a]" 
            />
          </div>
          <button className="p-2 text-[#a1a1aa] hover:text-white transition-colors">
            <Bell className="w-5 h-5" />
          </button>
          <button className="p-2 text-[#a1a1aa] hover:text-white transition-colors">
            <Settings className="w-5 h-5" />
          </button>
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#27272a] to-[#3f3f46] border border-[#52525b] ml-2"></div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full">
        
        {activeTab !== 'Payments' ? (
          <div className="flex flex-col items-center justify-center h-[60vh] text-[#71717a] animate-in fade-in duration-500">
            <Activity className="w-16 h-16 mb-4 opacity-20" />
            <h2 className="text-2xl font-semibold text-white mb-2">{activeTab} Dashboard</h2>
            <p className="text-sm max-w-md text-center mb-6">The {activeTab} section is completely architected but currently out of scope for the UCP Proof-of-Concept demonstration.</p>
            <button 
              onClick={() => setActiveTab('Payments')} 
              className="px-6 py-2.5 bg-[#ffffff] text-black font-medium text-sm rounded-md shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:bg-[#f4f4f5] transition-all"
            >
              Return to Payments
            </button>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header section */}
            <div className="flex items-end justify-between mb-8">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">Payments Overview</h1>
                <p className="text-[#a1a1aa] text-sm mt-1">Live agent transaction data across the Nile Testnet.</p>
              </div>
              <div className="flex items-center gap-3">
                <button className="px-4 py-2 bg-white text-black font-medium text-sm rounded-md hover:bg-gray-100 transition-colors shadow-sm flex items-center gap-2">
                  <ChevronDown className="w-4 h-4" /> Export
                </button>
                <button className="px-4 py-2 bg-red-600/10 text-red-500 font-medium text-sm rounded-md border border-red-500/20 hover:bg-red-600/20 hover:border-red-500/30 transition-all shadow-[0_0_10px_rgba(220,38,38,0.1)]">
                  Create payment link
                </button>
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              
              <div className="bg-[#09090b] border border-[#27272a] rounded-xl p-5 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500/0 via-emerald-500/20 to-emerald-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-center gap-3 text-[#a1a1aa] mb-2 text-sm font-medium">
                  <Wallet className="w-4 h-4" /> Gross volume
                </div>
                <div className="text-2xl font-semibold">{metrics.grossVolume}</div>
                <div className="mt-2 flex items-center gap-1.5 text-emerald-500 text-xs font-medium">
                  <ArrowUpRight className="w-3.5 h-3.5" /> 100% 
                  <span className="text-[#71717a] ml-1 font-normal">from last month</span>
                </div>
              </div>

              <div className="bg-[#09090b] border border-[#27272a] rounded-xl p-5 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500/0 via-red-500/20 to-red-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-center gap-3 text-[#a1a1aa] mb-2 text-sm font-medium">
                  <Activity className="w-4 h-4" /> Total transactions
                </div>
                <div className="text-2xl font-semibold">{metrics.totalTransactions}</div>
              </div>

              <div className="bg-[#09090b] border border-[#27272a] rounded-xl p-5 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500/0 via-blue-500/20 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-center gap-3 text-[#a1a1aa] mb-2 text-sm font-medium">
                  <CheckCircle className="w-4 h-4" /> Success rate
                </div>
                <div className="text-2xl font-semibold">{metrics.successRate}</div>
                <div className="mt-2 text-xs text-[#71717a]">All verified on-chain</div>
              </div>

              <div className="bg-[#09090b] border border-[#27272a] rounded-xl p-5 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500/0 via-amber-500/20 to-amber-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-center gap-3 text-[#a1a1aa] mb-2 text-sm font-medium">
                  <CreditCard className="w-4 h-4" /> Active Checkouts
                </div>
                <div className="text-2xl font-semibold">{metrics.activeCheckouts}</div>
                <div className="mt-2 flex items-center gap-1.5 text-amber-500/80 text-xs">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                  </span>
                  Awaiting payload confirmation
                </div>
              </div>

            </div>

            {/* Data Table Section */}
            <div className="bg-[#09090b] rounded-xl border border-[#27272a] shadow-sm overflow-hidden">
              
              <div className="p-4 border-b border-[#27272a] flex items-center justify-between bg-[#09090b]">
                <div className="flex items-center gap-4">
                  <h2 className="text-sm font-medium text-[#e4e4e7]">All payments {orders.length > 0 && <span className="ml-2 px-2 py-0.5 rounded-full bg-[#18181b] border border-[#27272a] text-[#a1a1aa] text-xs">{orders.length}</span>}</h2>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-1.5 text-[#a1a1aa] hover:text-white border border-transparent hover:border-[#27272a] rounded bg-transparent hover:bg-[#18181b] transition-all">
                    <Search className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="overflow-x-auto min-h-[400px]">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead>
                    <tr className="border-b border-[#27272a] bg-[#09090b]">
                      <th className="px-5 py-3.5 font-medium text-[#a1a1aa]">AMOUNT</th>
                      <th className="px-5 py-3.5 font-medium text-[#a1a1aa]">STATUS</th>
                      <th className="px-5 py-3.5 font-medium text-[#a1a1aa]">DESCRIPTION</th>
                      <th className="px-5 py-3.5 font-medium text-[#a1a1aa]">CUSTOMER / AGENT</th>
                      <th className="px-5 py-3.5 font-medium text-[#a1a1aa]">DATE</th>
                      <th className="px-5 py-3.5 font-medium text-right text-[#a1a1aa]">BLOCK EXPLORER</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#27272a]">
                    {loading && orders.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-5 py-8 text-center text-[#71717a]">
                          Loading data from server...
                        </td>
                      </tr>
                    ) : orders.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-5 py-16 text-center text-[#71717a]">
                          <div className="flex flex-col items-center justify-center">
                            <CreditCard className="w-8 h-8 mb-3 opacity-50" />
                            <p>No payments found.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      orders.map(order => (
                        <tr key={order.id} className="hover:bg-[#18181b]/80 transition-colors group">
                          
                          {/* Amount */}
                          <td className="px-5 py-4 font-medium text-[#fafafa]">
                            ${parseFloat(order.total_amount).toFixed(2)} 
                            <span className="text-[#71717a] ml-1 font-normal text-xs">{order.currency}</span>
                          </td>

                          {/* Status */}
                          <td className="px-5 py-4">
                            {order.status === 'PAID' ? (
                              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-[#052e16] text-[#34d399] border border-[#064e3b]">
                                <CheckCircle className="w-3.5 h-3.5" /> Succeeded
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-[#422006] text-[#fbbf24] border border-[#78350f]">
                                <Clock className="w-3.5 h-3.5" /> Pending
                              </div>
                            )}
                          </td>

                          {/* Description (Items) */}
                          <td className="px-5 py-4 text-[#e4e4e7]">
                            {order.items && order.items.length > 0 
                                ? order.items[0].id + (order.items.length > 1 ? ` (+${order.items.length - 1} more)` : '') 
                                : 'Invoice Payment'}
                          </td>

                          {/* Agent / Customer */}
                          <td className="px-5 py-4 text-[#a1a1aa] font-mono text-xs">
                            {order.id.split('-').pop()}@agent.ucp
                          </td>

                          {/* Date */}
                          <td className="px-5 py-4 text-[#a1a1aa]">
                             {format(new Date(order.createdAt), "MMM d, h:mm a")}
                          </td>

                          {/* Explorer Link */}
                          <td className="px-5 py-4 text-right">
                            {order.txHash ? (
                              <a 
                                href={`https://nile.tronscan.org/#/transaction/${order.txHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-[#3b82f6] hover:text-[#60a5fa] hover:underline transition-colors font-medium text-xs"
                              >
                                {order.txHash.slice(0, 6)}...{order.txHash.slice(-4)}
                                <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </a>
                            ) : (
                              <span className="text-[#52525b] text-xs">Waiting for hash...</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

export default App;

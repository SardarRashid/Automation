import React, { useState, useEffect } from 'react';
import { aiService } from '../../services/ai/AIService';

interface AIAssistantProps {
  context: 'sales' | 'inventory' | 'management';
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ context }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [insights, setInsights] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const newInsights: string[] = [];
      if (context === 'sales') {
        newInsights.push(await aiService.generateDailySummary());
        // For product suggestions and payments, we would normally pass a specific customerId.
        // We'll add a generic tip here for demonstration without a selected customer.
        newInsights.push("Tip: Review customer outstanding payments to improve cash flow.");
      } else if (context === 'inventory') {
        const lowStock = await aiService.predictLowStock();
        if (lowStock.length > 0) {
          newInsights.push(`Found ${lowStock.length} items with critically low stock based on sales velocity.`);
        } else {
          newInsights.push("Inventory levels are healthy.");
        }
        const anomalies = await aiService.detectAbnormalStock();
        newInsights.push(...anomalies);
      } else if (context === 'management') {
        const anomalies = await aiService.detectAnomalies();
        if (anomalies.length > 0) {
          newInsights.push(...anomalies);
        } else {
          newInsights.push("No anomalies detected in recent sales volume.");
        }
      }
      setInsights(newInsights);
    } catch (e) {
      console.error(e);
      setInsights(["Unable to fetch AI insights at this time."]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      fetchInsights();
    }
  }, [isOpen, context]);

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-full shadow-lg shadow-indigo-500/30 transition-all z-50 flex items-center justify-center group"
      >
        <svg className="w-6 h-6 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
        <span className="w-0 overflow-hidden group-hover:w-20 transition-all duration-300 ease-in-out whitespace-nowrap text-sm font-semibold pl-0 group-hover:pl-2">AI Insights</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-80 bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col">
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4 flex justify-between items-center text-white">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-indigo-100" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          <span className="font-semibold text-sm">InventorySuit AI</span>
        </div>
        <button onClick={() => setIsOpen(false)} className="text-white/70 hover:text-white transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
      
      <div className="p-4 flex-1 max-h-96 overflow-y-auto">
        {loading ? (
          <div className="flex flex-col gap-3 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {insights.map((insight, idx) => (
              <div key={idx} className="bg-indigo-50/50 rounded-lg p-3 border border-indigo-100/50">
                <p className="text-sm text-gray-700 leading-relaxed">{insight}</p>
              </div>
            ))}
            {insights.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">No new insights available.</p>
            )}
          </div>
        )}
      </div>
      <div className="bg-gray-50 p-3 text-xs text-center text-gray-400 border-t border-gray-100">
        AI responses are generated locally from your live data.
      </div>
    </div>
  );
};

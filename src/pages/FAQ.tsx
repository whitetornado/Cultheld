import { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  sort_order: number;
}

export const FAQ = () => {
  const [faqItems, setFaqItems] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    loadFAQ();
  }, []);

  const loadFAQ = async () => {
    const { data } = await supabase
      .from('faq_items')
      .select('*')
      .eq('is_published', true)
      .order('sort_order');

    if (data) {
      setFaqItems(data);
    }
    setLoading(false);
  };

  const toggleItem = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Veelgestelde Vragen
        </h1>
        <p className="text-xl text-gray-600 mb-12">
          Vind snel antwoorden op je vragen
        </p>

        {faqItems.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-600">
            Geen FAQ items beschikbaar
          </div>
        ) : (
          <div className="space-y-4">
            {faqItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-lg shadow-sm overflow-hidden"
              >
                <button
                  onClick={() => toggleItem(item.id)}
                  className="w-full px-6 py-5 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
                >
                  <span className="font-semibold text-lg pr-4">
                    {item.question}
                  </span>
                  <ChevronDown
                    className={`flex-shrink-0 transition-transform ${
                      openId === item.id ? 'transform rotate-180' : ''
                    }`}
                    size={24}
                  />
                </button>
                {openId === item.id && (
                  <div className="px-6 pb-5 pt-2 text-gray-700 leading-relaxed">
                    {item.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

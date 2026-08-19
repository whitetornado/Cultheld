import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, ArrowLeft } from 'lucide-react';
import { supabase, isAdmin } from '../../lib/supabase';
import { useToast } from '../../lib/toast';
import { useRouter } from '../../lib/router';
import { Modal } from '../../components/Modal';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  sort_order: number;
  is_published: boolean;
}

export const FAQManagement = () => {
  const { navigate } = useRouter();
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [faqItems, setFaqItems] = useState<FAQItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { success, error: showError } = useToast();

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    const access = await isAdmin();
    setHasAccess(access);
    if (access) {
      loadFAQItems();
    } else {
      setLoading(false);
    }
  };

  const loadFAQItems = async () => {
    const { data } = await supabase
      .from('faq_items')
      .select('*')
      .order('sort_order');

    if (data) {
      setFaqItems(data);
    }
    setLoading(false);
  };

  const openCreateModal = () => {
    setModalMode('create');
    setEditingId(null);
    setIsModalOpen(true);
  };

  const openEditModal = (id: string) => {
    setModalMode('edit');
    setEditingId(id);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const confirmDelete = (id: string) => {
    setDeleteId(id);
    setShowDeleteConfirm(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    const { error } = await supabase.from('faq_items').delete().eq('id', deleteId);

    if (error) {
      showError('Fout bij verwijderen: ' + error.message);
    } else {
      success('FAQ item succesvol verwijderd');
      loadFAQItems();
    }

    setShowDeleteConfirm(false);
    setDeleteId(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md px-4">
          <h1 className="text-2xl font-bold mb-4">Geen toegang</h1>
          <p className="text-gray-600 mb-6">
            Je hebt geen toegang tot het admin dashboard
          </p>
          <button
            onClick={() => navigate('/login')}
            className="inline-block bg-black text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
          >
            Ga naar Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate('/admin/dashboard')}
          className="flex items-center gap-2 text-gray-600 hover:text-black mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          Terug naar Dashboard
        </button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">FAQ Beheer</h1>
          <p className="text-gray-600 text-lg">
            Beheer de veelgestelde vragen op je website
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">FAQ Items</h2>
            <button
              onClick={openCreateModal}
              className="bg-black text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-800 transition-colors flex items-center gap-2"
            >
              <Plus size={20} />
              Nieuwe FAQ
            </button>
          </div>

          {faqItems.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              Geen FAQ items gevonden. Voeg je eerste vraag toe.
            </div>
          ) : (
            <div className="space-y-3">
              {faqItems.map((item) => (
                <div
                  key={item.id}
                  className="p-4 border border-gray-200 rounded-lg hover:border-gray-400 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="font-semibold mb-2 flex items-center gap-2">
                        {item.question}
                        {item.is_published ? (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                            Gepubliceerd
                          </span>
                        ) : (
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                            Concept
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 line-clamp-2">
                        {item.answer}
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        Sort order: {item.sort_order}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditModal(item.id)}
                        className="p-2 hover:bg-gray-100 rounded transition-colors"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => confirmDelete(item.id)}
                        className="p-2 hover:bg-red-100 text-red-600 rounded transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={modalMode === 'create' ? 'Nieuwe FAQ' : 'Bewerk FAQ'}
      >
        <FAQForm
          mode={modalMode}
          faqId={editingId}
          faqItems={faqItems}
          onSuccess={() => {
            loadFAQItems();
            closeModal();
          }}
        />
      </Modal>

      {showDeleteConfirm && (
        <Modal
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          title="Bevestig verwijdering"
        >
          <div className="space-y-4">
            <p className="text-gray-700">
              Weet je zeker dat je dit FAQ item wilt verwijderen? Deze actie kan niet
              ongedaan worden gemaakt.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Annuleren
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
              >
                Verwijderen
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

function FAQForm({
  mode,
  faqId,
  faqItems,
  onSuccess,
}: {
  mode: 'create' | 'edit';
  faqId: string | null;
  faqItems: FAQItem[];
  onSuccess: () => void;
}) {
  const currentFAQ = faqItems.find((f) => f.id === faqId);
  const [question, setQuestion] = useState(currentFAQ?.question || '');
  const [answer, setAnswer] = useState(currentFAQ?.answer || '');
  const [sortOrder, setSortOrder] = useState(
    currentFAQ?.sort_order.toString() || '0'
  );
  const [isPublished, setIsPublished] = useState(currentFAQ?.is_published ?? true);
  const [saving, setSaving] = useState(false);
  const { success, error } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const data = {
      question,
      answer,
      sort_order: parseInt(sortOrder),
      is_published: isPublished,
    };

    let result;
    if (mode === 'create') {
      result = await supabase.from('faq_items').insert(data);
    } else {
      result = await supabase.from('faq_items').update(data).eq('id', faqId);
    }

    if (result.error) {
      error('Fout: ' + result.error.message);
    } else {
      success(mode === 'create' ? 'FAQ item toegevoegd' : 'FAQ item bijgewerkt');
      onSuccess();
    }

    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-semibold mb-2">Vraag</label>
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="bijv. Hoe lang duurt de levertijd?"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2">Antwoord</label>
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          rows={6}
          placeholder="Het antwoord op de vraag..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
          required
        />
        <p className="text-sm text-gray-500 mt-1">
          Gebruik duidelijke en beknopte antwoorden
        </p>
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2">Sort Order</label>
        <input
          type="number"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
          required
        />
        <p className="text-sm text-gray-500 mt-1">
          Lagere nummers verschijnen bovenaan
        </p>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="is_published"
          checked={isPublished}
          onChange={(e) => setIsPublished(e.target.checked)}
          className="w-5 h-5"
        />
        <label htmlFor="is_published" className="font-semibold">
          Gepubliceerd
        </label>
        <span className="text-sm text-gray-500">
          (alleen gepubliceerde FAQ items zijn zichtbaar voor bezoekers)
        </span>
      </div>

      <div className="flex gap-3 justify-end pt-4">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          {saving ? 'Bezig...' : mode === 'create' ? 'Toevoegen' : 'Bijwerken'}
        </button>
      </div>
    </form>
  );
}

import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, ChevronDown, ChevronUp, Copy } from 'lucide-react';
import { supabase, isAdmin } from '../lib/supabase';
import { Link } from '../lib/router';
import { Season, Club, Legend, ProductType, ProductVariant, ShirtTemplate, ProductConfig } from '../lib/types';
import { useToast } from '../lib/toast';
import { Modal } from '../components/Modal';
import { ImageUpload } from '../components/ImageUpload';
import { LegendOnShirtPreview } from '../components/LegendOnShirtPreview';
import { PrintAreaEditor } from '../components/PrintAreaEditor';
import { uploadLegendImage, uploadShirtTemplate, uploadProductMockup } from '../lib/storage';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  sort_order: number;
  is_published: boolean;
}

type Tab = 'seasons' | 'clubs' | 'legends' | 'products' | 'templates' | 'configs' | 'faq';

export const Admin = () => {
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('seasons');
  const { success, error: showError, info } = useToast();

  const [seasons, setSeasons] = useState<Season[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [legends, setLegends] = useState<Legend[]>([]);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [shirtTemplates, setShirtTemplates] = useState<ShirtTemplate[]>([]);
  const [productConfigs, setProductConfigs] = useState<ProductConfig[]>([]);
  const [faqItems, setFaqItems] = useState<FAQItem[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [copyingTemplateId, setCopyingTemplateId] = useState<string | null>(null);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteType, setDeleteType] = useState<string>('');

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    const access = await isAdmin();
    setHasAccess(access);
    if (access) {
      loadData();
    } else {
      setLoading(false);
    }
  };

  const loadData = async () => {
    const [seasonsRes, clubsRes, legendsRes, typesRes, variantsRes, templatesRes, configsRes, faqRes] = await Promise.all([
      supabase.from('seasons').select('*').order('sort_order', { ascending: false }),
      supabase.from('clubs').select('*').order('name'),
      supabase.from('legends').select('*').order('name'),
      supabase.from('product_types').select('*'),
      supabase.from('product_variants').select('*'),
      supabase.from('shirt_templates').select('*').order('sort_order'),
      supabase.from('product_configs').select('*').order('sort_order'),
      supabase.from('faq_items').select('*').order('sort_order'),
    ]);

    if (seasonsRes.error) console.error('Error loading seasons:', seasonsRes.error);
    if (clubsRes.error) console.error('Error loading clubs:', clubsRes.error);
    if (legendsRes.error) console.error('Error loading legends:', legendsRes.error);
    if (typesRes.error) console.error('Error loading product types:', typesRes.error);
    if (variantsRes.error) console.error('Error loading variants:', variantsRes.error);
    if (templatesRes.error) console.error('Error loading templates:', templatesRes.error);
    if (configsRes.error) console.error('Error loading configs:', configsRes.error);
    if (faqRes.error) console.error('Error loading FAQ:', faqRes.error);

    if (seasonsRes.data) setSeasons(seasonsRes.data);
    if (clubsRes.data) setClubs(clubsRes.data);
    if (legendsRes.data) setLegends(legendsRes.data);
    if (typesRes.data) setProductTypes(typesRes.data);
    if (variantsRes.data) setVariants(variantsRes.data);
    if (templatesRes.data) setShirtTemplates(templatesRes.data);
    if (configsRes.data) setProductConfigs(configsRes.data);
    if (faqRes.data) setFaqItems(faqRes.data);

    setLoading(false);
  };

  const openCreateModal = () => {
    setModalMode('create');
    setEditingId(null);
    setCopyingTemplateId(null);
    setIsModalOpen(true);
  };

  const openEditModal = (id: string) => {
    setModalMode('edit');
    setEditingId(id);
    setCopyingTemplateId(null);
    setIsModalOpen(true);
  };

  const copyTemplate = (id: string) => {
    setModalMode('create');
    setEditingId(null);
    setCopyingTemplateId(id);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setCopyingTemplateId(null);
  };

  const confirmDelete = (id: string, type: string) => {
    setDeleteId(id);
    setDeleteType(type);
    setShowDeleteConfirm(true);
  };

  const handleDelete = async () => {
    if (!deleteId || !deleteType) return;

    console.log('Attempting to delete:', { deleteType, deleteId });

    const { error, data } = await supabase.from(deleteType).delete().eq('id', deleteId);

    console.log('Delete result:', { error, data });

    if (error) {
      console.error('Delete error details:', error);
      showError('Fout bij verwijderen: ' + error.message);
    } else {
      success('Item succesvol verwijderd');
      loadData();
    }

    setShowDeleteConfirm(false);
    setDeleteId(null);
    setDeleteType('');
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
          <Link
            to="/login"
            className="inline-block bg-black text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
          >
            Ga naar Login
          </Link>
          <p className="text-sm text-gray-500 mt-4">
            Log in met admin@cultheld.nl om toegang te krijgen
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Admin Dashboard</h1>
          <p className="text-gray-600">Beheer je Cultheld platform</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="flex border-b overflow-x-auto">
            <button
              onClick={() => setActiveTab('seasons')}
              className={`px-6 py-4 font-semibold whitespace-nowrap ${
                activeTab === 'seasons'
                  ? 'border-b-2 border-black'
                  : 'text-gray-500 hover:text-black'
              }`}
            >
              Seizoenen ({seasons.length})
            </button>
            <button
              onClick={() => setActiveTab('clubs')}
              className={`px-6 py-4 font-semibold whitespace-nowrap ${
                activeTab === 'clubs'
                  ? 'border-b-2 border-black'
                  : 'text-gray-500 hover:text-black'
              }`}
            >
              Clubs ({clubs.length})
            </button>
            <button
              onClick={() => setActiveTab('legends')}
              className={`px-6 py-4 font-semibold whitespace-nowrap ${
                activeTab === 'legends'
                  ? 'border-b-2 border-black'
                  : 'text-gray-500 hover:text-black'
              }`}
            >
              Legends ({legends.length})
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`px-6 py-4 font-semibold whitespace-nowrap ${
                activeTab === 'products'
                  ? 'border-b-2 border-black'
                  : 'text-gray-500 hover:text-black'
              }`}
            >
              Producten ({variants.length})
            </button>
            <button
              onClick={() => setActiveTab('templates')}
              className={`px-6 py-4 font-semibold whitespace-nowrap ${
                activeTab === 'templates'
                  ? 'border-b-2 border-black'
                  : 'text-gray-500 hover:text-black'
              }`}
            >
              Shirt Templates ({shirtTemplates.length})
            </button>
            <button
              onClick={() => setActiveTab('configs')}
              className={`px-6 py-4 font-semibold whitespace-nowrap ${
                activeTab === 'configs'
                  ? 'border-b-2 border-black'
                  : 'text-gray-500 hover:text-black'
              }`}
            >
              Product Templates ({productConfigs.length})
            </button>
            <button
              onClick={() => setActiveTab('faq')}
              className={`px-6 py-4 font-semibold whitespace-nowrap ${
                activeTab === 'faq'
                  ? 'border-b-2 border-black'
                  : 'text-gray-500 hover:text-black'
              }`}
            >
              FAQ ({faqItems.length})
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'seasons' && (
              <SeasonsTab
                seasons={seasons}
                onAdd={openCreateModal}
                onEdit={openEditModal}
                onDelete={(id) => confirmDelete(id, 'seasons')}
              />
            )}

            {activeTab === 'clubs' && (
              <ClubsTab
                clubs={clubs}
                onAdd={openCreateModal}
                onEdit={openEditModal}
                onDelete={(id) => confirmDelete(id, 'clubs')}
              />
            )}

            {activeTab === 'legends' && (
              <LegendsTab
                legends={legends}
                onAdd={openCreateModal}
                onEdit={openEditModal}
                onDelete={(id) => confirmDelete(id, 'legends')}
              />
            )}

            {activeTab === 'products' && (
              <ProductsTab
                variants={variants}
                productTypes={productTypes}
                onAdd={openCreateModal}
                onEdit={openEditModal}
                onDelete={(id) => confirmDelete(id, 'product_variants')}
              />
            )}

            {activeTab === 'templates' && (
              <ShirtTemplatesTab
                templates={shirtTemplates}
                onAdd={openCreateModal}
                onEdit={openEditModal}
                onCopy={copyTemplate}
                onDelete={(id) => confirmDelete(id, 'shirt_templates')}
              />
            )}

            {activeTab === 'configs' && (
              <ProductConfigsTab
                configs={productConfigs}
                productTypes={productTypes}
                legends={legends}
                onEdit={openEditModal}
                onCopy={copyTemplate}
                onDelete={(id) => confirmDelete(id, 'product_configs')}
              />
            )}

            {activeTab === 'faq' && (
              <FAQTab
                faqItems={faqItems}
                onAdd={openCreateModal}
                onEdit={openEditModal}
                onDelete={(id) => confirmDelete(id, 'faq_items')}
              />
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={
          modalMode === 'create'
            ? `Nieuwe ${activeTab === 'seasons' ? 'seizoen' : activeTab === 'clubs' ? 'club' : activeTab === 'legends' ? 'legend' : activeTab === 'templates' ? 'shirt template' : activeTab === 'faq' ? 'FAQ' : 'variant'}`
            : `Bewerk ${activeTab === 'seasons' ? 'seizoen' : activeTab === 'clubs' ? 'club' : activeTab === 'legends' ? 'legend' : activeTab === 'templates' ? 'shirt template' : activeTab === 'faq' ? 'FAQ' : 'variant'}`
        }
      >
        {activeTab === 'seasons' && (
          <SeasonForm
            mode={modalMode}
            seasonId={editingId}
            seasons={seasons}
            onSuccess={() => {
              loadData();
              closeModal();
            }}
          />
        )}
        {activeTab === 'clubs' && (
          <ClubForm
            mode={modalMode}
            clubId={editingId}
            clubs={clubs}
            seasons={seasons}
            onSuccess={() => {
              loadData();
              closeModal();
            }}
          />
        )}
        {activeTab === 'legends' && (
          <LegendForm
            mode={modalMode}
            legendId={editingId}
            legends={legends}
            clubs={clubs}
            seasons={seasons}
            shirtTemplates={shirtTemplates}
            onSuccess={() => {
              loadData();
              closeModal();
            }}
          />
        )}
        {activeTab === 'products' && (
          <VariantForm
            mode={modalMode}
            variantId={editingId}
            variants={variants}
            productTypes={productTypes}
            onSuccess={() => {
              loadData();
              closeModal();
            }}
          />
        )}
        {activeTab === 'templates' && (
          <ShirtTemplateForm
            mode={modalMode}
            templateId={editingId}
            copyingTemplateId={copyingTemplateId}
            templates={shirtTemplates}
            onSuccess={() => {
              loadData();
              closeModal();
            }}
          />
        )}
        {activeTab === 'configs' && (
          <ProductConfigForm
            mode={modalMode}
            configId={editingId}
            copyingConfigId={copyingTemplateId}
            configs={productConfigs}
            productTypes={productTypes}
            legends={legends}
            onSuccess={() => {
              loadData();
              closeModal();
            }}
          />
        )}
        {activeTab === 'faq' && (
          <FAQForm
            mode={modalMode}
            faqId={editingId}
            faqItems={faqItems}
            onSuccess={() => {
              loadData();
              closeModal();
            }}
          />
        )}
      </Modal>

      {showDeleteConfirm && (
        <Modal
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          title="Bevestig verwijdering"
        >
          <div className="space-y-4">
            <p className="text-gray-700">
              Weet je zeker dat je dit item wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.
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

function SeasonsTab({
  seasons,
  onAdd,
  onEdit,
  onDelete,
}: {
  seasons: Season[];
  onAdd: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Seizoenen</h2>
        <button
          onClick={onAdd}
          className="bg-black text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-800 transition-colors flex items-center gap-2"
        >
          <Plus size={20} />
          Nieuw seizoen
        </button>
      </div>

      <div className="space-y-3">
        {seasons.map((season) => (
          <div
            key={season.id}
            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-400 transition-colors"
          >
            <div>
              <div className="font-semibold">{season.name}</div>
              <div className="text-sm text-gray-600">
                Sort order: {season.sort_order}
                {season.is_active && (
                  <span className="ml-3 text-green-600 font-medium">Actief</span>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onEdit(season.id)}
                className="p-2 hover:bg-gray-100 rounded transition-colors"
              >
                <Edit size={18} />
              </button>
              <button
                onClick={() => onDelete(season.id)}
                className="p-2 hover:bg-red-100 text-red-600 rounded transition-colors"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ClubsTab({
  clubs,
  onAdd,
  onEdit,
  onDelete,
}: {
  clubs: Club[];
  onAdd: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Clubs</h2>
        <button
          onClick={onAdd}
          className="bg-black text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-800 transition-colors flex items-center gap-2"
        >
          <Plus size={20} />
          Nieuwe club
        </button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clubs.map((club) => (
          <div
            key={club.id}
            className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-gray-400 transition-colors"
          >
            {club.logo_url ? (
              <img
                src={club.logo_url}
                alt={club.name}
                className="w-12 h-12 object-contain"
              />
            ) : (
              <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                <span className="text-xl font-bold text-gray-400">
                  {club.name.charAt(0)}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="font-semibold truncate">{club.name}</div>
              <div className="text-sm text-gray-600 truncate">
                {club.slug}
                {club.city ? ` · ${club.city}` : ' · geen stad ingesteld'}
              </div>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => onEdit(club.id)}
                className="p-2 hover:bg-gray-100 rounded transition-colors"
              >
                <Edit size={16} />
              </button>
              <button
                onClick={() => onDelete(club.id)}
                className="p-2 hover:bg-red-100 text-red-600 rounded transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LegendsTab({
  legends,
  onAdd,
  onEdit,
  onDelete,
}: {
  legends: Legend[];
  onAdd: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Legends</h2>
        <button
          onClick={onAdd}
          className="bg-black text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-800 transition-colors flex items-center gap-2"
        >
          <Plus size={20} />
          Nieuwe legend
        </button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {legends.map((legend) => (
          <div
            key={legend.id}
            className="border border-gray-200 rounded-lg hover:border-gray-400 transition-colors overflow-hidden"
          >
            <div className="aspect-square bg-gray-100">
              <img
                src={legend.png_url}
                alt={legend.name}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="p-4">
              <div className="font-semibold mb-1">{legend.name}</div>
              <div className="text-sm text-gray-600 mb-3">
                {legend.category === 'eredivisie' ? 'Eredivisie' : 'Wereldlegend'}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onEdit(legend.id)}
                  className="flex-1 p-2 bg-gray-100 hover:bg-gray-200 rounded transition-colors text-sm font-medium"
                >
                  <Edit size={16} className="inline mr-1" />
                  Bewerken
                </button>
                <button
                  onClick={() => onDelete(legend.id)}
                  className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProductsTab({
  variants,
  productTypes,
  onAdd,
  onEdit,
  onDelete,
}: {
  variants: ProductVariant[];
  productTypes: ProductType[];
  onAdd: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Product Varianten</h2>
        <button
          onClick={onAdd}
          className="bg-black text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-800 transition-colors flex items-center gap-2"
        >
          <Plus size={20} />
          Nieuwe variant
        </button>
      </div>

      <div className="mb-6">
        <h3 className="font-semibold mb-3">Product Types</h3>
        <div className="flex gap-4">
          {productTypes.map((type) => (
            <div
              key={type.id}
              className="px-4 py-2 border border-gray-200 rounded-lg"
            >
              <div className="font-semibold">{type.name}</div>
              <div className="text-sm text-gray-600">
                €{type.base_price.toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {variants.slice(0, 50).map((variant) => (
          <div
            key={variant.id}
            className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-gray-400 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div
                className="w-8 h-8 rounded border border-gray-300"
                style={{ backgroundColor: variant.color_hex }}
              />
              <div>
                <div className="font-semibold">
                  {variant.product_type_id.toUpperCase()} - {variant.color_name} -{' '}
                  {variant.size}
                </div>
                <div className="text-sm text-gray-600">€{variant.price.toFixed(2)}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`text-xs px-2 py-1 rounded ${
                  variant.available
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {variant.available ? 'Beschikbaar' : 'Niet beschikbaar'}
              </span>
              <button
                onClick={() => onEdit(variant.id)}
                className="p-2 hover:bg-gray-100 rounded transition-colors"
              >
                <Edit size={16} />
              </button>
              <button
                onClick={() => onDelete(variant.id)}
                className="p-2 hover:bg-red-100 text-red-600 rounded transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SeasonForm({
  mode,
  seasonId,
  seasons,
  onSuccess,
}: {
  mode: 'create' | 'edit';
  seasonId: string | null;
  seasons: Season[];
  onSuccess: () => void;
}) {
  const currentSeason = seasons.find((s) => s.id === seasonId);
  const [name, setName] = useState(currentSeason?.name || '');
  const [startYear, setStartYear] = useState(currentSeason?.start_year.toString() || '');
  const [endYear, setEndYear] = useState(currentSeason?.end_year.toString() || '');
  const [sortOrder, setSortOrder] = useState(currentSeason?.sort_order.toString() || '1');
  const [isActive, setIsActive] = useState(currentSeason?.is_active || false);
  const [saving, setSaving] = useState(false);
  const { success, error } = useToast();

  const handleStartYearChange = (value: string) => {
    setStartYear(value);
    if (mode === 'create' && value) {
      const start = parseInt(value);
      const end = start + 1;
      setEndYear(end.toString());
      setName(`${start}/${end.toString().slice(-2)}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const data = {
      name,
      start_year: parseInt(startYear),
      end_year: parseInt(endYear),
      sort_order: parseInt(sortOrder),
      is_active: isActive,
    };

    console.log('Season form data:', data);
    console.log('Mode:', mode, 'SeasonId:', seasonId);

    let result;
    if (mode === 'create') {
      result = await supabase.from('seasons').insert(data);
    } else {
      result = await supabase.from('seasons').update(data).eq('id', seasonId);
    }

    console.log('Season update/insert result:', result);

    if (result.error) {
      console.error('Season error details:', result.error);
      error('Fout: ' + result.error.message);
    } else {
      success(mode === 'create' ? 'Seizoen toegevoegd' : 'Seizoen bijgewerkt');
      onSuccess();
    }

    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-semibold mb-2">Startjaar</label>
        <input
          type="number"
          value={startYear}
          onChange={(e) => handleStartYearChange(e.target.value)}
          placeholder="2023"
          min="2000"
          max="2100"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2">Eindjaar</label>
        <input
          type="number"
          value={endYear}
          onChange={(e) => setEndYear(e.target.value)}
          placeholder="2024"
          min="2000"
          max="2100"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2">Naam</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="2023/24"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
          required
        />
        <p className="text-sm text-gray-500 mt-1">Wordt automatisch ingevuld op basis van startjaar</p>
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
        <p className="text-sm text-gray-500 mt-1">Hogere nummers verschijnen eerst</p>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="is_active"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="w-5 h-5"
        />
        <label htmlFor="is_active" className="font-semibold">
          Actief seizoen
        </label>
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

function ClubForm({
  mode,
  clubId,
  clubs,
  seasons,
  onSuccess,
}: {
  mode: 'create' | 'edit';
  clubId: string | null;
  clubs: Club[];
  seasons: Season[];
  onSuccess: () => void;
}) {
  const currentClub = clubs.find((c) => c.id === clubId);
  const [name, setName] = useState(currentClub?.name || '');
  const [slug, setSlug] = useState(currentClub?.slug || '');
  const [city, setCity] = useState(currentClub?.city || '');
  const [logoUrl, setLogoUrl] = useState(currentClub?.logo_url || '');
  const [seasonId, setSeasonId] = useState(currentClub?.season_id || seasons[0]?.id || '');
  const [saving, setSaving] = useState(false);
  const { success, error } = useToast();

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleNameChange = (value: string) => {
    setName(value);
    if (mode === 'create') {
      setSlug(generateSlug(value));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const data = {
      name,
      slug,
      city: city || null,
      logo_url: logoUrl || null,
      season_id: seasonId,
    };

    let result;
    if (mode === 'create') {
      result = await supabase.from('clubs').insert(data);
    } else {
      result = await supabase.from('clubs').update(data).eq('id', clubId);
    }

    if (result.error) {
      error('Fout: ' + result.error.message);
    } else {
      success(mode === 'create' ? 'Club toegevoegd' : 'Club bijgewerkt');
      onSuccess();
    }

    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-semibold mb-2">Naam</label>
        <input
          type="text"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2">Slug</label>
        <input
          type="text"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2">Stad</label>
        <input
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="bv. Amsterdam"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
        />
        <p className="text-sm text-gray-500 mt-1">
          Gebruikt in de paginatitel en zoekmachine-omschrijving (bv. "Ajax shirt kopen – Amsterdam"). Laat leeg als niet van toepassing.
        </p>
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2">Logo URL</label>
        <input
          type="url"
          value={logoUrl}
          onChange={(e) => setLogoUrl(e.target.value)}
          placeholder="https://..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
        />
        <p className="text-sm text-gray-500 mt-1">Voeg een externe afbeelding URL toe</p>
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2">Seizoen</label>
        <select
          value={seasonId}
          onChange={(e) => setSeasonId(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
          required
        >
          {seasons.map((season) => (
            <option key={season.id} value={season.id}>
              {season.name}
            </option>
          ))}
        </select>
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

function LegendForm({
  mode,
  legendId,
  legends,
  clubs,
  shirtTemplates,
  seasons,
  onSuccess,
}: {
  mode: 'create' | 'edit';
  legendId: string | null;
  legends: Legend[];
  clubs: Club[];
  shirtTemplates: ShirtTemplate[];
  seasons: Season[];
  onSuccess: () => void;
}) {
  const currentLegend = legends.find((l) => l.id === legendId);
  const [name, setName] = useState(currentLegend?.name || '');
  const [slug, setSlug] = useState(currentLegend?.slug || '');
  const [category, setCategory] = useState<'eredivisie' | 'world'>(
    currentLegend?.category || 'eredivisie'
  );
  const [clubId, setClubId] = useState(currentLegend?.club_id || clubs[0]?.id || '');
  const [seasonId, setSeasonId] = useState<string>('');
  const [pngUrl, setPngUrl] = useState(currentLegend?.png_url || '');
  const [bio, setBio] = useState(currentLegend?.bio || '');
  const [saving, setSaving] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentLegend?.png_url || null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>(shirtTemplates[0]?.id || '');
  const { success, error } = useToast();

  useEffect(() => {
    if (mode === 'edit' && legendId && clubId) {
      loadLegendAssignment();
    } else if (seasons.length > 0) {
      const activeSeason = seasons.find(s => s.is_active);
      if (activeSeason) {
        setSeasonId(activeSeason.id);
      }
    }
  }, [mode, legendId, clubId, seasons]);

  const loadLegendAssignment = async () => {
    const { data } = await supabase
      .from('legend_assignments')
      .select('season_id')
      .eq('legend_id', legendId)
      .eq('club_id', clubId)
      .maybeSingle();

    if (data?.season_id) {
      setSeasonId(data.season_id);
    } else if (seasons.length > 0) {
      const activeSeason = seasons.find(s => s.is_active);
      if (activeSeason) {
        setSeasonId(activeSeason.id);
      }
    }
  };

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleNameChange = (value: string) => {
    setName(value);
    if (mode === 'create') {
      setSlug(generateSlug(value));
    }
  };

  const handleImageChange = (file: File | null, preview: string | null) => {
    setUploadedFile(file);
    setPreviewUrl(preview);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    let finalPngUrl = pngUrl;

    if (uploadedFile) {
      const uploadedUrl = await uploadLegendImage(uploadedFile);
      if (uploadedUrl) {
        finalPngUrl = uploadedUrl;
      } else {
        error('Fout bij uploaden van afbeelding');
        setSaving(false);
        return;
      }
    }

    if (!finalPngUrl) {
      error('Voeg een legend afbeelding toe');
      setSaving(false);
      return;
    }

    const data = {
      name,
      slug,
      category,
      club_id: clubId || null,
      png_url: finalPngUrl,
      bio,
    };

    let result;
    let insertedLegendId = legendId;

    if (mode === 'create') {
      result = await supabase.from('legends').insert(data).select().single();
      if (result.data) {
        insertedLegendId = result.data.id;
      }
    } else {
      result = await supabase.from('legends').update(data).eq('id', legendId);
    }

    if (result.error) {
      error('Fout: ' + result.error.message);
      setSaving(false);
      return;
    }

    if (clubId && seasonId && insertedLegendId) {
      // Check if assignment already exists
      const { data: existingAssignment } = await supabase
        .from('legend_assignments')
        .select('id')
        .eq('legend_id', insertedLegendId)
        .eq('club_id', clubId)
        .eq('season_id', seasonId)
        .maybeSingle();

      if (existingAssignment) {
        // Assignment already exists, no need to do anything
        success(mode === 'create' ? 'Legend en seizoen koppeling toegevoegd' : 'Legend en seizoen koppeling bijgewerkt');
        onSuccess();
        setSaving(false);
        return;
      }

      // Delete old assignments for this legend and club (different seasons)
      await supabase
        .from('legend_assignments')
        .delete()
        .eq('legend_id', insertedLegendId)
        .eq('club_id', clubId);

      // Insert new assignment
      const assignmentResult = await supabase
        .from('legend_assignments')
        .insert({
          legend_id: insertedLegendId,
          club_id: clubId,
          season_id: seasonId,
        });

      if (assignmentResult.error) {
        error('Legend opgeslagen, maar fout bij seizoen koppeling: ' + assignmentResult.error.message);
        setSaving(false);
        return;
      }
    }

    success(mode === 'create' ? 'Legend en seizoen koppeling toegevoegd' : 'Legend en seizoen koppeling bijgewerkt');
    onSuccess();

    setSaving(false);
  };

  const currentTemplate = shirtTemplates.find((t) => t.id === selectedTemplate);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">Naam</label>
            <input
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Slug</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
              required
            />
            <p className="text-sm text-gray-500 mt-1">Automatisch gegenereerd</p>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Categorie</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as 'eredivisie' | 'world')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
            >
              <option value="eredivisie">Eredivisie</option>
              <option value="world">Wereldlegend</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">
              Club {category === 'eredivisie' && <span className="text-red-500">*</span>}
            </label>
            <select
              value={clubId}
              onChange={(e) => setClubId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
              required={category === 'eredivisie'}
            >
              <option value="">Selecteer club</option>
              {clubs.map((club) => (
                <option key={club.id} value={club.id}>
                  {club.name}
                </option>
              ))}
            </select>
            {category === 'eredivisie' && (
              <p className="text-sm text-gray-500 mt-1">
                Verplicht voor Eredivisie legends
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">
              Seizoen {category === 'eredivisie' && <span className="text-red-500">*</span>}
            </label>
            <select
              value={seasonId}
              onChange={(e) => setSeasonId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
              disabled={category === 'world'}
              required={category === 'eredivisie'}
            >
              <option value="">Selecteer seizoen</option>
              {seasons.map((season) => (
                <option key={season.id} value={season.id}>
                  {season.name} {season.is_active && '(Actief)'}
                </option>
              ))}
            </select>
            {category === 'eredivisie' && (
              <p className="text-sm text-gray-500 mt-1">
                Verplicht voor Eredivisie legends
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
              required
            />
          </div>
        </div>

        <div className="space-y-4">
          <ImageUpload
            label="Legend Afbeelding (PNG)"
            currentImageUrl={currentLegend?.png_url}
            onImageChange={handleImageChange}
            accept="image/png,image/jpeg,image/jpg,image/webp"
            helpText="Upload een transparante PNG voor beste resultaten"
          />

          {shirtTemplates.length > 0 && (
            <div>
              <label className="block text-sm font-semibold mb-2">
                Preview op shirt template
              </label>
              <select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black mb-3"
              >
                {shirtTemplates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name} - {template.fabric_type}
                  </option>
                ))}
              </select>

              {previewUrl && currentTemplate && (
                <LegendOnShirtPreview
                  shirtImageUrl={currentTemplate.template_url}
                  legendImageUrl={previewUrl}
                  blendMode={currentTemplate.blend_mode}
                  shirtColor={currentTemplate.color_hex}
                  className="mt-3"
                />
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-3 justify-end pt-4 border-t">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          {saving ? 'Bezig met uploaden...' : mode === 'create' ? 'Toevoegen' : 'Bijwerken'}
        </button>
      </div>
    </form>
  );
}

function VariantForm({
  mode,
  variantId,
  variants,
  productTypes,
  onSuccess,
}: {
  mode: 'create' | 'edit';
  variantId: string | null;
  variants: ProductVariant[];
  productTypes: ProductType[];
  onSuccess: () => void;
}) {
  const currentVariant = variants.find((v) => v.id === variantId);
  const [productTypeId, setProductTypeId] = useState(
    currentVariant?.product_type_id || productTypes[0]?.id || ''
  );
  const [colorName, setColorName] = useState(currentVariant?.color_name || '');
  const [colorHex, setColorHex] = useState(currentVariant?.color_hex || '#000000');
  const [size, setSize] = useState(currentVariant?.size || 'M');
  const [price, setPrice] = useState(currentVariant?.price.toString() || '39.99');
  const [mockupImageUrl, setMockupImageUrl] = useState(
    currentVariant?.mockup_image_url || '/mockups/legend_op_shirt.jpg'
  );
  const [available, setAvailable] = useState(currentVariant?.available ?? true);
  const [saving, setSaving] = useState(false);
  const { success, error } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const data = {
      product_type_id: productTypeId,
      color_name: colorName,
      color_hex: colorHex,
      size,
      price: parseFloat(price),
      mockup_image_url: mockupImageUrl,
      available,
    };

    let result;
    if (mode === 'create') {
      result = await supabase.from('product_variants').insert(data);
    } else {
      result = await supabase.from('product_variants').update(data).eq('id', variantId);
    }

    if (result.error) {
      error('Fout: ' + result.error.message);
    } else {
      success(mode === 'create' ? 'Variant toegevoegd' : 'Variant bijgewerkt');
      onSuccess();
    }

    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-semibold mb-2">Product Type</label>
        <select
          value={productTypeId}
          onChange={(e) => setProductTypeId(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
          required
        >
          {productTypes.map((type) => (
            <option key={type.id} value={type.id}>
              {type.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2">Kleur naam</label>
        <input
          type="text"
          value={colorName}
          onChange={(e) => setColorName(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2">Kleur hex</label>
        <div className="flex gap-2">
          <input
            type="color"
            value={colorHex}
            onChange={(e) => setColorHex(e.target.value)}
            className="w-16 h-10 rounded border border-gray-300"
          />
          <input
            type="text"
            value={colorHex}
            onChange={(e) => setColorHex(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2">Maat</label>
        <select
          value={size}
          onChange={(e) => setSize(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
        >
          <option value="XS">XS</option>
          <option value="S">S</option>
          <option value="M">M</option>
          <option value="L">L</option>
          <option value="XL">XL</option>
          <option value="XXL">XXL</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2">Prijs (€)</label>
        <input
          type="number"
          step="0.01"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2">Mockup afbeelding URL</label>
        <input
          type="text"
          value={mockupImageUrl}
          onChange={(e) => setMockupImageUrl(e.target.value)}
          placeholder="/mockups/legend_op_shirt.jpg"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
          required
        />
        <p className="text-sm text-gray-500 mt-1">Pad naar de mockup afbeelding</p>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="available"
          checked={available}
          onChange={(e) => setAvailable(e.target.checked)}
          className="w-5 h-5"
        />
        <label htmlFor="available" className="font-semibold">
          Beschikbaar
        </label>
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

function ShirtTemplatesTab({
  templates,
  onAdd,
  onEdit,
  onDelete,
  onCopy,
}: {
  templates: ShirtTemplate[];
  onAdd: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onCopy: (id: string) => void;
}) {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Shirt Templates</h2>
        <button
          onClick={onAdd}
          className="bg-black text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-800 transition-colors flex items-center gap-2"
        >
          <Plus size={20} />
          Nieuw template
        </button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => (
          <div
            key={template.id}
            className="border border-gray-200 rounded-lg overflow-hidden hover:border-gray-400 transition-colors"
          >
            <div className="aspect-square bg-gray-100">
              <img
                src={template.template_url}
                alt={template.name}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="p-4">
              <div className="font-semibold mb-1">{template.name}</div>
              <div className="text-sm text-gray-600 mb-2">
                {template.fabric_type} - {template.blend_mode}
              </div>
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-6 h-6 rounded border border-gray-300"
                  style={{ backgroundColor: template.color_hex }}
                />
                <span className="text-xs text-gray-600">{template.color_hex}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onEdit(template.id)}
                  className="flex-1 p-2 bg-gray-100 hover:bg-gray-200 rounded transition-colors text-sm font-medium"
                >
                  <Edit size={16} className="inline mr-1" />
                  Bewerken
                </button>
                <button
                  onClick={() => onCopy(template.id)}
                  className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded transition-colors"
                  title="Kopieer template"
                >
                  <Copy size={16} />
                </button>
                <button
                  onClick={() => onDelete(template.id)}
                  className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ShirtTemplateForm({
  mode,
  templateId,
  copyingTemplateId,
  templates,
  onSuccess,
}: {
  mode: 'create' | 'edit';
  templateId: string | null;
  copyingTemplateId: string | null;
  templates: ShirtTemplate[];
  onSuccess: () => void;
}) {
  const currentTemplate = templates.find((t) => t.id === templateId);
  const copyingTemplate = templates.find((t) => t.id === copyingTemplateId);
  const templateData = currentTemplate || copyingTemplate;

  const [name, setName] = useState(templateData ? (copyingTemplate ? `${templateData.name} (kopie)` : templateData.name) : '');
  const [fabricType, setFabricType] = useState(templateData?.fabric_type || 'cotton');
  const [colorHex, setColorHex] = useState(templateData?.color_hex || '#FFFFFF');
  const [blendMode, setBlendMode] = useState(templateData?.blend_mode || 'multiply');
  const [sortOrder, setSortOrder] = useState(templateData?.sort_order.toString() || '0');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(templateData?.template_url || null);
  const [saving, setSaving] = useState(false);
  const { success, error } = useToast();

  const handleImageChange = (file: File | null, preview: string | null) => {
    setUploadedFile(file);
    setPreviewUrl(preview);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    let templateUrl = currentTemplate?.template_url || '';

    if (uploadedFile) {
      const uploadedUrl = await uploadShirtTemplate(uploadedFile);
      if (uploadedUrl) {
        templateUrl = uploadedUrl;
      } else {
        error('Fout bij uploaden van template');
        setSaving(false);
        return;
      }
    }

    if (!templateUrl) {
      error('Voeg een shirt template afbeelding toe');
      setSaving(false);
      return;
    }

    const data = {
      name,
      template_url: templateUrl,
      color_hex: colorHex,
      fabric_type: fabricType,
      blend_mode: blendMode,
      sort_order: parseInt(sortOrder),
    };

    let result;
    if (mode === 'create') {
      result = await supabase.from('shirt_templates').insert(data).select();

      if (result.error) {
        error('Fout: ' + result.error.message);
        setSaving(false);
        return;
      }

      const SIZES = ['S', 'M', 'L', 'XL', 'XXL'];
      const { data: productTypes } = await supabase.from('product_types').select('id');

      if (productTypes && productTypes.length > 0) {
        const variants = [];
        for (const productType of productTypes) {
          for (const size of SIZES) {
            variants.push({
              product_type_id: productType.id,
              color_name: name,
              color_hex: colorHex,
              size,
              price: productType.id === 'hoodie' ? '54.99' : productType.id === 'sweater' ? '49.99' : '29.99',
              mockup_image_url: templateUrl,
              available: true,
            });
          }
        }

        const variantsResult = await supabase.from('product_variants').insert(variants);

        if (variantsResult.error) {
          console.error('Error creating variants:', variantsResult.error);
        } else {
          success(`Template en ${variants.length} varianten toegevoegd`);
        }
      } else {
        success('Template toegevoegd');
      }
    } else {
      result = await supabase.from('shirt_templates').update(data).eq('id', templateId);

      if (result.error) {
        error('Fout: ' + result.error.message);
        setSaving(false);
        return;
      }

      success('Template bijgewerkt');
    }

    onSuccess();
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">Naam</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Wit Katoenen Shirt"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Textielsoort</label>
            <input
              type="text"
              value={fabricType}
              onChange={(e) => setFabricType(e.target.value)}
              placeholder="cotton, polyester, blend"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Basis kleur</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={colorHex}
                onChange={(e) => setColorHex(e.target.value)}
                className="w-16 h-10 rounded border border-gray-300"
              />
              <input
                type="text"
                value={colorHex}
                onChange={(e) => setColorHex(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Blend Mode</label>
            <select
              value={blendMode}
              onChange={(e) => setBlendMode(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
            >
              <option value="multiply">Multiply (donker)</option>
              <option value="screen">Screen (licht)</option>
              <option value="overlay">Overlay (gemiddeld)</option>
              <option value="soft-light">Soft Light</option>
              <option value="hard-light">Hard Light</option>
            </select>
            <p className="text-sm text-gray-500 mt-1">
              Bepaalt hoe de legend op het shirt geprojecteerd wordt
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
          </div>
        </div>

        <div>
          <ImageUpload
            label="Shirt Template Afbeelding"
            currentImageUrl={currentTemplate?.template_url}
            onImageChange={handleImageChange}
            accept="image/png,image/jpeg,image/jpg,image/webp"
            helpText="Upload een foto van een blanco shirt"
          />
        </div>
      </div>

      <div className="flex gap-3 justify-end pt-4 border-t">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          {saving ? 'Bezig met uploaden...' : mode === 'create' ? 'Toevoegen' : 'Bijwerken'}
        </button>
      </div>
    </form>
  );
}

function ProductConfigsTab({
  configs,
  productTypes,
  legends,
  onEdit,
  onDelete,
  onCopy,
}: {
  configs: ProductConfig[];
  productTypes: ProductType[];
  legends: Legend[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onCopy: (id: string) => void;
}) {
  const groupedConfigs = productTypes.map((type) => ({
    type,
    configs: configs.filter((c) => c.product_type_id === type.id),
  }));

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Product Templates</h2>
        <p className="text-gray-600">
          Configureer print area per kleur. Alle legends gebruiken automatisch deze instellingen.
        </p>
      </div>

      {groupedConfigs.map(({ type, configs: typeConfigs }) => (
        <div key={type.id} className="mb-8">
          <h3 className="text-xl font-bold mb-4 capitalize">{type.name}</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {typeConfigs.map((config) => (
              <div
                key={config.id}
                className="border border-gray-200 rounded-lg overflow-hidden hover:border-gray-400 transition-colors"
              >
                <div className="aspect-square bg-gray-100 relative">
                  <img
                    src={config.mockup_template_url}
                    alt={config.color_name}
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute top-2 right-2 flex gap-1">
                    {config.is_default && (
                      <span className="bg-black text-white text-xs px-2 py-1 rounded">
                        Default
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-6 h-6 rounded border border-gray-300"
                      style={{ backgroundColor: config.color_hex }}
                    />
                    <span className="font-semibold">{config.color_name}</span>
                  </div>
                  <div className="text-xs text-gray-600 mb-3 space-y-1">
                    <div>
                      Print: {(config.print_area_width * 100).toFixed(0)}% x{' '}
                      {(config.print_area_height * 100).toFixed(0)}%
                    </div>
                    <div className="capitalize">
                      Mode: {config.fit_mode} | Padding: {(config.padding_percent * 100).toFixed(0)}%
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onEdit(config.id)}
                      className="flex-1 p-2 bg-gray-100 hover:bg-gray-200 rounded transition-colors text-sm font-medium"
                    >
                      <Edit size={16} className="inline mr-1" />
                      Bewerken
                    </button>
                    <button
                      onClick={() => onCopy(config.id)}
                      className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded transition-colors"
                      title="Kopieer template"
                    >
                      <Copy size={16} />
                    </button>
                    <button
                      onClick={() => onDelete(config.id)}
                      className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ProductConfigForm({
  mode,
  configId,
  copyingConfigId,
  configs,
  productTypes,
  legends,
  onSuccess,
}: {
  mode: 'create' | 'edit';
  configId: string | null;
  copyingConfigId?: string | null;
  configs: ProductConfig[];
  productTypes: ProductType[];
  legends: Legend[];
  onSuccess: () => void;
}) {
  const currentConfig = configs.find((c) => c.id === configId);
  const copyingConfig = configs.find((c) => c.id === copyingConfigId);
  const configData = currentConfig || copyingConfig;

  const [productTypeId, setProductTypeId] = useState(configData?.product_type_id || productTypes[0]?.id || '');
  const [colorName, setColorName] = useState(configData ? (copyingConfig ? `${configData.color_name} (kopie)` : configData.color_name) : '');
  const [colorHex, setColorHex] = useState(configData?.color_hex || '#FFFFFF');
  const [mockupTemplateUrl, setMockupTemplateUrl] = useState(configData?.mockup_template_url || '');
  const [blendMode, setBlendMode] = useState(configData?.blend_mode || 'multiply');
  const [isDefault, setIsDefault] = useState(copyingConfig ? false : (currentConfig?.is_default || false));
  const [sortOrder, setSortOrder] = useState(configData?.sort_order?.toString() || '0');

  const [printArea, setPrintArea] = useState({
    x: configData?.print_area_x || 0.5,
    y: configData?.print_area_y || 0.35,
    width: configData?.print_area_width || 0.3,
    height: configData?.print_area_height || 0.4,
  });
  const [fitMode, setFitMode] = useState<'contain' | 'cover' | 'smart_fit'>(configData?.fit_mode || 'contain');
  const [paddingPercent, setPaddingPercent] = useState(configData?.padding_percent || 0.05);
  const [verticalBias, setVerticalBias] = useState(configData?.vertical_bias || 0.5);

  const [testLegendId, setTestLegendId] = useState<string>(legends[0]?.id || '');
  const [saving, setSaving] = useState(false);
  const [uploadedMockupFile, setUploadedMockupFile] = useState<File | null>(null);
  const [mockupPreviewUrl, setMockupPreviewUrl] = useState<string | null>(configData?.mockup_template_url || null);
  const [isSettingsCollapsed, setIsSettingsCollapsed] = useState(false);
  const { success, error } = useToast();

  const testLegend = legends.find((l) => l.id === testLegendId);

  useEffect(() => {
    if (mode === 'create') {
      const defaultConfig = configs.find(
        (c) => c.product_type_id === productTypeId && c.is_default
      );

      if (defaultConfig) {
        setPrintArea({
          x: defaultConfig.print_area_x,
          y: defaultConfig.print_area_y,
          width: defaultConfig.print_area_width,
          height: defaultConfig.print_area_height,
        });
        setPaddingPercent(defaultConfig.padding_percent);
        setFitMode(defaultConfig.fit_mode);
        setVerticalBias(defaultConfig.vertical_bias);
        setBlendMode(defaultConfig.blend_mode);
      }
    }
  }, [mode, productTypeId, configs]);

  const handleMockupImageChange = (file: File | null, preview: string | null) => {
    setUploadedMockupFile(file);
    setMockupPreviewUrl(preview);
  };

  const copyPrintAreaFromDefault = () => {
    const defaultConfig = configs.find(
      (c) => c.product_type_id === productTypeId && c.is_default
    );

    if (defaultConfig) {
      setPrintArea({
        x: defaultConfig.print_area_x,
        y: defaultConfig.print_area_y,
        width: defaultConfig.print_area_width,
        height: defaultConfig.print_area_height,
      });
      setPaddingPercent(defaultConfig.padding_percent);
      setFitMode(defaultConfig.fit_mode);
      setVerticalBias(defaultConfig.vertical_bias);
      success('Print area instellingen overgenomen van default template');
    } else {
      error('Geen default template gevonden voor dit product type');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    let finalMockupUrl = mockupTemplateUrl;

    if (uploadedMockupFile) {
      const uploadedUrl = await uploadProductMockup(uploadedMockupFile);
      if (uploadedUrl) {
        finalMockupUrl = uploadedUrl;
      } else {
        error('Fout bij uploaden van mockup afbeelding');
        setSaving(false);
        return;
      }
    }

    if (!finalMockupUrl) {
      error('Voeg een mockup afbeelding toe');
      setSaving(false);
      return;
    }

    const data = {
      product_type_id: productTypeId,
      color_name: colorName,
      color_hex: colorHex,
      mockup_template_url: finalMockupUrl,
      blend_mode: blendMode,
      is_default: isDefault,
      sort_order: parseInt(sortOrder),
      print_area_x: printArea.x,
      print_area_y: printArea.y,
      print_area_width: printArea.width,
      print_area_height: printArea.height,
      fit_mode: fitMode,
      padding_percent: paddingPercent,
      vertical_bias: verticalBias,
    };

    let result;
    if (mode === 'create') {
      result = await supabase.from('product_configs').insert(data).select();

      if (result.error) {
        error('Fout: ' + result.error.message);
        setSaving(false);
        return;
      }

      const SIZES = ['S', 'M', 'L', 'XL', 'XXL'];
      const variants = [];

      for (const size of SIZES) {
        variants.push({
          product_type_id: productTypeId,
          color_name: colorName,
          color_hex: colorHex,
          size,
          price: productTypeId === 'hoodie' ? '54.99' : productTypeId === 'sweater' ? '49.99' : '29.99',
          mockup_image_url: finalMockupUrl,
          available: true,
        });
      }

      const variantsResult = await supabase.from('product_variants').insert(variants);

      if (variantsResult.error) {
        console.error('Error creating variants:', variantsResult.error);
        success('Template toegevoegd (fout bij varianten)');
      } else {
        success(`Template en ${variants.length} varianten toegevoegd`);
      }
    } else {
      result = await supabase.from('product_configs').update(data).eq('id', configId);

      if (result.error) {
        error('Fout: ' + result.error.message);
        setSaving(false);
        return;
      }

      success('Template bijgewerkt');
    }

    onSuccess();
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-6">
        <div className="border border-gray-300 rounded-lg">
          <button
            type="button"
            onClick={() => setIsSettingsCollapsed(!isSettingsCollapsed)}
            className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors rounded-t-lg"
          >
            <span className="font-semibold text-lg">Product Instellingen</span>
            {isSettingsCollapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
          </button>

          {!isSettingsCollapsed && (
            <div className="p-4 grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Product Type</label>
                <select
                  value={productTypeId}
                  onChange={(e) => setProductTypeId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                  required
                >
                  {productTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Kleur naam</label>
                <input
                  type="text"
                  value={colorName}
                  onChange={(e) => setColorName(e.target.value)}
                  placeholder="Wit"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Kleur hex</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={colorHex}
                    onChange={(e) => setColorHex(e.target.value)}
                    className="w-16 h-10 rounded border border-gray-300"
                  />
                  <input
                    type="text"
                    value={colorHex}
                    onChange={(e) => setColorHex(e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Blend Mode</label>
                <select
                  value={blendMode}
                  onChange={(e) => setBlendMode(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                >
                  <option value="multiply">Multiply (voor lichte shirts)</option>
                  <option value="screen">Screen (voor donkere shirts)</option>
                  <option value="overlay">Overlay</option>
                  <option value="soft-light">Soft Light</option>
                  <option value="hard-light">Hard Light</option>
                </select>
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
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Test Legend</label>
                <select
                  value={testLegendId}
                  onChange={(e) => setTestLegendId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                >
                  {legends.map((legend) => (
                    <option key={legend.id} value={legend.id}>
                      {legend.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <ImageUpload
                  label="Mockup Template"
                  currentImageUrl={currentConfig?.mockup_template_url}
                  onImageChange={handleMockupImageChange}
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  helpText="Upload een foto van een blanco product in deze kleur"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_default"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="w-5 h-5"
                />
                <label htmlFor="is_default" className="font-semibold">
                  Default kleur
                </label>
              </div>
            </div>
          )}
        </div>

        {(mockupPreviewUrl || mockupTemplateUrl) && testLegend && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-xl font-bold">Print Area Editor</label>
              {!isDefault && configs.find((c) => c.product_type_id === productTypeId && c.is_default) && (
                <button
                  type="button"
                  onClick={copyPrintAreaFromDefault}
                  className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg font-semibold transition-colors"
                >
                  Kopieer van default template
                </button>
              )}
            </div>
            {isDefault ? (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                <strong>Default Template:</strong> Deze config dient als template voor alle andere kleuren van dit product type. Print area instellingen worden automatisch overgenomen bij nieuwe kleuren.
              </div>
            ) : configs.find((c) => c.product_type_id === productTypeId && c.is_default) ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                <strong>Tip:</strong> Voor consistente prints op alle kleuren van dit product type, gebruik de "Kopieer van default template" knop. Resize gebeurt altijd in verhouding.
              </div>
            ) : (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm text-orange-800">
                <strong>Let op:</strong> Er is nog geen default template voor dit product type. Maak eerst een default config aan of vink "Default kleur" aan.
              </div>
            )}
            <PrintAreaEditor
              mockupImageUrl={mockupPreviewUrl || mockupTemplateUrl}
              testLegendUrl={testLegend.png_url}
              printArea={printArea}
              padding={paddingPercent}
              fitMode={fitMode}
              verticalBias={verticalBias}
              onPrintAreaChange={setPrintArea}
              onPaddingChange={setPaddingPercent}
              onFitModeChange={setFitMode}
              onVerticalBiasChange={setVerticalBias}
            />
          </div>
        )}
      </div>

      <div className="flex gap-3 justify-end pt-4 border-t">
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

function FAQTab({
  faqItems,
  onAdd,
  onEdit,
  onDelete,
}: {
  faqItems: FAQItem[];
  onAdd: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">FAQ Items</h2>
        <button
          onClick={onAdd}
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
                    onClick={() => onEdit(item.id)}
                    className="p-2 hover:bg-gray-100 rounded transition-colors"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => onDelete(item.id)}
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
  );
}

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
  const [sortOrder, setSortOrder] = useState(currentFAQ?.sort_order.toString() || '0');
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

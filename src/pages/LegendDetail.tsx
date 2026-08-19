import { useEffect, useState } from 'react';
import { ChevronLeft, ShoppingCart, Check } from 'lucide-react';
import { useRouter } from '../lib/router';
import { useCart } from '../lib/cart';
import { supabase } from '../lib/supabase';
import { Legend, ProductType, ProductConfig } from '../lib/types';
import { MockupPreview } from '../components/MockupPreview';

const SIZES = ['S', 'M', 'L', 'XL', 'XXL'];

export const LegendDetail = () => {
  const { navigate, params } = useRouter();
  const { addToCart } = useCart();
  const [legend, setLegend] = useState<Legend | null>(null);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [productConfigs, setProductConfigs] = useState<ProductConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [selectedProductType, setSelectedProductType] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('M');
  const [quantity, setQuantity] = useState(1);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  useEffect(() => {
    if (params.legendSlug) {
      loadLegendData();
    }
  }, [params.legendSlug]);

  const loadLegendData = async () => {
    const { data: legendData } = await supabase
      .from('legends')
      .select('*')
      .eq('slug', params.legendSlug)
      .single();

    if (legendData) {
      setLegend(legendData);

      const [typesRes, configsRes] = await Promise.all([
        supabase.from('product_types').select('*'),
        supabase.from('product_configs').select('*').order('sort_order'),
      ]);

      if (typesRes.data) {
        setProductTypes(typesRes.data);
        if (typesRes.data.length > 0 && !selectedProductType) {
          setSelectedProductType(typesRes.data[0].id);
        }
      }

      if (configsRes.data) {
        setProductConfigs(configsRes.data);
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    if (selectedProductType && productConfigs.length > 0) {
      const colors = getAvailableColors();
      if (colors.length > 0) {
        const defaultColor = colors.find(c => c.is_default) || colors[0];
        setSelectedColor(defaultColor.color_name);
      }
    }
  }, [selectedProductType, productConfigs]);

  const getAvailableColors = () => {
    return productConfigs.filter((c) => c.product_type_id === selectedProductType);
  };

  const getCurrentConfig = () => {
    return productConfigs.find(
      (c) => c.product_type_id === selectedProductType && c.color_name === selectedColor
    );
  };

  const getCurrentPrice = () => {
    const productType = productTypes.find((t) => t.id === selectedProductType);
    return productType ? Number(productType.base_price) : 0;
  };

  const handleAddToCart = async () => {
    if (!legend) return;

    const productType = productTypes.find((t) => t.id === selectedProductType);
    if (!productType) return;

    setAddingToCart(true);

    try {
      const { data: variant, error: variantError } = await supabase
        .from('product_variants')
        .select('*')
        .eq('product_type_id', selectedProductType)
        .eq('color_name', selectedColor)
        .eq('size', selectedSize)
        .maybeSingle();

      if (variantError) {
        console.error('Error fetching variant:', variantError);
        throw new Error('Kon productvariant niet ophalen');
      }

      if (!variant) {
        console.error('Variant not found:', { selectedProductType, selectedColor, selectedSize });
        throw new Error('Deze combinatie is momenteel niet beschikbaar. Probeer een andere kleur of maat.');
      }

      const success = await addToCart(legend.id, variant.id, quantity, previewUrl);
      if (success) {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  if (!legend) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Legend niet gevonden</h1>
          <button onClick={() => window.history.back()} className="text-black hover:underline">
            Terug
          </button>
        </div>
      </div>
    );
  }

  const config = getCurrentConfig();
  const colors = getAvailableColors();
  const price = getCurrentPrice();

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-black mb-8 transition-colors"
        >
          <ChevronLeft size={20} />
          Terug
        </button>

        <div className="lg:grid lg:grid-cols-2 gap-12">
          <div className="sticky top-16 lg:top-20 lg:self-start bg-white pb-3 lg:pb-0 border-b lg:border-0 z-10">
            {config && (
              <div className="h-[40vh] lg:h-auto flex items-center justify-center">
                <MockupPreview
                  mockupImageUrl={config.mockup_template_url}
                  legendPngUrl={legend.png_url}
                  printArea={{
                    x: config.print_area_x,
                    y: config.print_area_y,
                    width: config.print_area_width,
                    height: config.print_area_height,
                    fitMode: config.fit_mode,
                    padding: config.padding_percent,
                    verticalBias: config.vertical_bias,
                    maxFillPct: config.max_fill_pct,
                    minVisualSize: config.min_visual_size,
                  }}
                  className="rounded-lg overflow-hidden shadow-lg max-h-full w-auto mx-auto"
                  onRender={setPreviewUrl}
                  enableZoom={true}
                />
              </div>
            )}
          </div>

          <div className="pt-4 pb-24 lg:pb-0 bg-white relative">
            <h1 className="text-4xl font-bold mb-4">{legend.name}</h1>
            {legend.bio && (
              <p className="text-gray-600 mb-8 whitespace-pre-line">{legend.bio}</p>
            )}

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold mb-3">
                  Kies product type
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {productTypes.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setSelectedProductType(type.id)}
                      className={`p-4 border-2 rounded-lg font-semibold transition-all ${
                        selectedProductType === type.id
                          ? 'border-black bg-black text-white'
                          : 'border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      <div>{type.name}</div>
                      <div className="text-xs mt-1 opacity-75">
                        €{Number(type.base_price).toFixed(2)}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {selectedProductType && colors.length > 0 && (
                <div>
                  <label className="block text-sm font-semibold mb-3">
                    Kies kleur: {selectedColor}
                  </label>
                  <div className="flex gap-3 flex-wrap">
                    {colors.map((color) => (
                      <button
                        key={color.id}
                        onClick={() => setSelectedColor(color.color_name)}
                        className={`w-12 h-12 rounded-full border-2 transition-all ${
                          selectedColor === color.color_name
                            ? 'border-black scale-110'
                            : 'border-gray-300 hover:scale-105'
                        }`}
                        style={{ backgroundColor: color.color_hex }}
                        title={color.color_name}
                      />
                    ))}
                  </div>
                </div>
              )}

              {selectedColor && (
                <div>
                  <label className="block text-sm font-semibold mb-3">Kies maat</label>
                  <div className="grid grid-cols-5 gap-2">
                    {SIZES.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`p-3 border-2 rounded-lg font-semibold transition-all ${
                          selectedSize === size
                            ? 'border-black bg-black text-white'
                            : 'border-gray-200 hover:border-gray-400'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                  <button className="text-sm text-gray-600 hover:underline mt-2">
                    Bekijk maattabel
                  </button>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold mb-3">Aantal</label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 border-2 border-gray-200 rounded-lg hover:border-black transition-colors font-semibold"
                  >
                    -
                  </button>
                  <span className="text-xl font-semibold w-12 text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 border-2 border-gray-200 rounded-lg hover:border-black transition-colors font-semibold"
                  >
                    +
                  </button>
                </div>
              </div>

              {config && (
                <div className="border-t pt-6">
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-2xl font-bold">
                      €{(price * quantity).toFixed(2)}
                    </span>
                  </div>

                  <button
                    onClick={handleAddToCart}
                    disabled={addingToCart}
                    className="w-full bg-black text-white py-4 rounded-lg font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {addingToCart ? (
                      'Toevoegen...'
                    ) : showSuccess ? (
                      <>
                        <Check size={20} />
                        Toegevoegd aan winkelwagen
                      </>
                    ) : (
                      <>
                        <ShoppingCart size={20} />
                        In winkelwagen
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
        {config && (
          <button
            onClick={handleAddToCart}
            disabled={addingToCart}
            className="w-full bg-black text-white py-4 rounded-lg font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {addingToCart ? (
              'Toevoegen...'
            ) : showSuccess ? (
              <>
                <Check size={20} />
                Toegevoegd
              </>
            ) : (
              <>
                In winkelwagen - €{(price * quantity).toFixed(2)}
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

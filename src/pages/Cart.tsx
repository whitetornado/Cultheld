import { ChevronLeft, Trash2, ShoppingBag } from 'lucide-react';
import { useRouter } from '../lib/router';
import { useCart } from '../lib/cart';

const SHIPPING_COST = 4.95;
const FREE_SHIPPING_THRESHOLD = 50;

export const Cart = () => {
  const { navigate } = useRouter();
  const { items, updateQuantity, removeItem, itemCount } = useCart();

  const subtotal = items.reduce((sum, item) => {
    return sum + (item.product_variant?.price || 0) * item.quantity;
  }, 0);

  const shippingCost = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const total = subtotal + shippingCost;

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-8">Winkelwagen</h1>
          <div className="bg-white rounded-lg p-12 text-center">
            <ShoppingBag size={64} className="mx-auto mb-4 text-gray-400" />
            <h2 className="text-2xl font-semibold mb-2">Je winkelwagen is leeg</h2>
            <p className="text-gray-600 mb-6">Voeg culthelden toe aan je winkelwagen</p>
            <button
              onClick={() => navigate('/')}
              className="bg-black text-white px-8 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
            >
              Start met shoppen
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-gray-600 hover:text-black mb-8 transition-colors"
        >
          <ChevronLeft size={20} />
          Verder shoppen
        </button>

        <h1 className="text-3xl md:text-4xl font-bold mb-6 md:mb-8">Winkelwagen ({itemCount})</h1>

        <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div key={item.id} className="bg-white rounded-lg p-4 md:p-6">
                <div className="flex gap-4 md:gap-6">
                  <div className="w-20 h-20 md:w-32 md:h-32 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                    {item.preview_url ? (
                      <img
                        src={item.preview_url}
                        alt={item.legend?.name}
                        className="w-full h-full object-cover"
                      />
                    ) : item.legend?.png_url ? (
                      <img
                        src={item.legend.png_url}
                        alt={item.legend.name}
                        className="w-full h-full object-contain"
                      />
                    ) : null}
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <h3 className="text-lg md:text-xl font-bold mb-1 truncate">{item.legend?.name}</h3>
                      <p className="text-gray-600 text-xs md:text-sm mb-2">
                        {item.product_variant?.product_type_id?.toUpperCase()} - {item.product_variant?.color_name} - {item.product_variant?.size}
                      </p>
                      <p className="text-lg md:text-xl font-bold md:hidden">
                        €{((item.product_variant?.price || 0) * item.quantity).toFixed(2)}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 mt-3 md:mt-4">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-8 h-8 border-2 border-gray-200 rounded hover:border-black transition-colors text-lg font-semibold"
                      >
                        -
                      </button>
                      <span className="font-semibold w-8 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 border-2 border-gray-200 rounded hover:border-black transition-colors text-lg font-semibold"
                      >
                        +
                      </button>

                      <button
                        onClick={() => removeItem(item.id)}
                        className="ml-auto text-red-600 hover:text-red-800 transition-colors p-2"
                        aria-label="Verwijder item"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>

                  <div className="text-right hidden md:block">
                    <p className="text-xl font-bold">
                      €{((item.product_variant?.price || 0) * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="bg-white rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-6">Samenvatting</h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotaal</span>
                  <span className="font-semibold">€{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Verzendkosten</span>
                  <span className="font-semibold">
                    {shippingCost === 0 ? (
                      <span className="text-green-600">GRATIS</span>
                    ) : (
                      `€${shippingCost.toFixed(2)}`
                    )}
                  </span>
                </div>
                {subtotal < FREE_SHIPPING_THRESHOLD && (
                  <p className="text-sm text-gray-600">
                    Bestel voor €{(FREE_SHIPPING_THRESHOLD - subtotal).toFixed(2)} meer voor
                    gratis verzending
                  </p>
                )}
              </div>

              <div className="border-t pt-4 mb-6">
                <div className="flex justify-between text-xl font-bold">
                  <span>Totaal</span>
                  <span>€{total.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={() => navigate('/checkout')}
                className="w-full bg-black text-white py-4 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
              >
                Naar afrekenen
              </button>

              <p className="text-xs text-gray-500 text-center mt-4">
                Veilig betalen met iDEAL, creditcard en meer
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

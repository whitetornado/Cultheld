import { useEffect, useState } from 'react';
import { ArrowRight, CheckCircle, Truck, RotateCcw, User, ShoppingBag, Package } from 'lucide-react';
import { useRouter } from '../lib/router';
import { supabase } from '../lib/supabase';
import { Season, Legend } from '../lib/types';
import { useSEO } from '../lib/seo';

export const Home = () => {
  const { navigate } = useRouter();
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [globalLegends, setGlobalLegends] = useState<Legend[]>([]);
  const [designs, setDesigns] = useState<Legend[]>([]);
  const [loading, setLoading] = useState(true);

  useSEO({
    title: 'Cultheld - Draag jouw voetbalheld op premium streetwear',
    description: 'Kies jouw favoriete voetballegende uit de Eredivisie of wereldlegends en draag ze op premium hoodies, sweaters en t-shirts. We all love football.',
    path: '/',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Cultheld',
      url: 'https://cultheld.nl',
      logo: 'https://cultheld.nl/logo-ch.png',
    },
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [seasonsRes, legendsRes, designsRes] = await Promise.all([
      supabase.from('seasons').select('*').order('start_year', { ascending: false }),
      supabase.from('legends').select('*').eq('category', 'world').limit(3),
      supabase.from('legends').select('*').eq('category', 'design').limit(3),
    ]);

    if (seasonsRes.data) {
      // Sort seasons: active season first, then by start_year descending
      const sortedSeasons = seasonsRes.data.sort((a, b) => {
        if (a.is_active && !b.is_active) return -1;
        if (!a.is_active && b.is_active) return 1;
        return b.start_year - a.start_year;
      });
      setSeasons(sortedSeasons);
    }
    if (legendsRes.data) setGlobalLegends(legendsRes.data);
    if (designsRes.data) setDesigns(designsRes.data);
    setLoading(false);
  };

  return (
    <div className="min-h-screen">
      <section className="relative h-[500px] md:h-[600px] flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/vriendschappelijke_wedstrijd_haarlem_tegen_ajax,_cruijff_probeert_voetbalschoene,_bestanddeelnr_925-3488 copy.jpg')",
            backgroundPosition: 'center 45%',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight text-white drop-shadow-2xl">
              Draag jouw cultheld
            </h1>
            <p className="text-xl md:text-2xl text-white mb-10 font-light drop-shadow-lg">
              Kies jouw seizoen. Kies jouw club. Draag jouw legend op premium streetwear.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/seizoenen')}
                className="bg-white text-black px-8 py-4 rounded-lg font-bold hover:bg-gray-100 transition-all flex items-center justify-center gap-2 shadow-2xl hover:shadow-white/20 hover:scale-105"
              >
                Kies je seizoen
                <ArrowRight size={20} />
              </button>
              <button
                onClick={() => navigate('/legends')}
                className="bg-transparent backdrop-blur-sm border-2 border-white px-8 py-4 rounded-lg font-bold hover:bg-white hover:text-black transition-all text-white shadow-2xl hover:scale-105"
              >
                Bekijk wereldlegends
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 md:py-28 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Hoe het werkt</h2>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
              In drie simpele stappen draag jij jouw favoriete voetbalheld
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12 md:gap-6 lg:gap-8 max-w-6xl mx-auto">
            <div className="group relative bg-white rounded-2xl p-8 md:p-10 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-gray-100">
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gradient-to-br from-gray-900 to-gray-700 text-white w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold shadow-xl group-hover:scale-110 transition-transform duration-300">
                1
              </div>
              <div className="mt-8 mb-6 flex justify-center">
                <div className="bg-gray-100 group-hover:bg-gray-900 p-6 rounded-2xl transition-colors duration-300">
                  <User size={40} className="text-gray-900 group-hover:text-white transition-colors duration-300" />
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-3 text-center">Kies je held</h3>
              <p className="text-gray-600 text-center leading-relaxed">
                Selecteer je favoriete seizoen en club, daarna je cultheld
              </p>
            </div>

            <div className="group relative bg-white rounded-2xl p-8 md:p-10 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-gray-100">
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gradient-to-br from-gray-900 to-gray-700 text-white w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold shadow-xl group-hover:scale-110 transition-transform duration-300">
                2
              </div>
              <div className="mt-8 mb-6 flex justify-center">
                <div className="bg-gray-100 group-hover:bg-gray-900 p-6 rounded-2xl transition-colors duration-300">
                  <ShoppingBag size={40} className="text-gray-900 group-hover:text-white transition-colors duration-300" />
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-3 text-center">Kies je product</h3>
              <p className="text-gray-600 text-center leading-relaxed">
                Hoodie, sweater of t-shirt? Kies je kleur en maat
              </p>
            </div>

            <div className="group relative bg-white rounded-2xl p-8 md:p-10 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-gray-100">
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gradient-to-br from-gray-900 to-gray-700 text-white w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold shadow-xl group-hover:scale-110 transition-transform duration-300">
                3
              </div>
              <div className="mt-8 mb-6 flex justify-center">
                <div className="bg-gray-100 group-hover:bg-gray-900 p-6 rounded-2xl transition-colors duration-300">
                  <Package size={40} className="text-gray-900 group-hover:text-white transition-colors duration-300" />
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-3 text-center">Ontvang je item</h3>
              <p className="text-gray-600 text-center leading-relaxed">
                Wij printen en verzenden jouw unieke cultheld merchandise
              </p>
            </div>
          </div>
        </div>
      </section>

      {!loading && seasons.length > 0 && (
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold">Kies je seizoen</h2>
              <button
                onClick={() => navigate('/seizoenen')}
                className="text-black hover:underline font-semibold flex items-center gap-2"
              >
                Alle seizoenen
                <ArrowRight size={20} />
              </button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {seasons.slice(0, 4).map((season) => (
                <button
                  key={season.id}
                  onClick={() => navigate(`/seizoen/${season.start_year}-${season.end_year}`)}
                  className="group bg-white border-2 border-gray-200 rounded-lg p-8 hover:border-black transition-all hover:shadow-lg"
                >
                  <div className="text-center">
                    <div className="text-4xl font-bold mb-2">{season.name}</div>
                    <div className="text-gray-600 mb-4">Eredivisie</div>
                    <div className="flex items-center justify-center gap-2 text-black font-semibold group-hover:gap-3 transition-all">
                      Bekijk clubs
                      <ArrowRight size={16} />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {!loading && globalLegends.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold">Wereldlegends</h2>
              <button
                onClick={() => navigate('/legends')}
                className="text-black hover:underline font-semibold flex items-center gap-2"
              >
                Alle legends
                <ArrowRight size={20} />
              </button>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {globalLegends.map((legend) => (
                <button
                  key={legend.id}
                  onClick={() => navigate(`/legend/${legend.slug}`)}
                  className="group bg-white rounded-lg overflow-hidden hover:shadow-xl transition-all"
                >
                  <div className="aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
                    <img
                      src={legend.png_url}
                      alt={legend.name}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-2">{legend.name}</h3>
                    <p className="text-gray-600 text-sm line-clamp-2">{legend.bio}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {!loading && designs.length > 0 && (
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold">Designs</h2>
              <button
                onClick={() => navigate('/designs')}
                className="text-black hover:underline font-semibold flex items-center gap-2"
              >
                Alle designs
                <ArrowRight size={20} />
              </button>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {designs.map((design) => (
                <button
                  key={design.id}
                  onClick={() => navigate(`/legend/${design.slug}`)}
                  className="group bg-white rounded-lg overflow-hidden hover:shadow-xl transition-all border border-gray-100"
                >
                  <div className="aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
                    <img
                      src={design.png_url}
                      alt={design.name}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-2">{design.name}</h3>
                    <p className="text-gray-600 text-sm line-clamp-2">{design.bio}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="flex items-start gap-4">
              <div className="bg-black text-white p-3 rounded-lg">
                <Truck size={24} />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Gratis verzending</h3>
                <p className="text-sm text-gray-600">Bij bestellingen vanaf 50 euro</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-black text-white p-3 rounded-lg">
                <RotateCcw size={24} />
              </div>
              <div>
                <h3 className="font-semibold mb-1">30 dagen retour</h3>
                <p className="text-sm text-gray-600">Niet tevreden? Geld terug garantie</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-black text-white p-3 rounded-lg">
                <CheckCircle size={24} />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Premium kwaliteit</h3>
                <p className="text-sm text-gray-600">Hoogwaardige prints en materialen</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

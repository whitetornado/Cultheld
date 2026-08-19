import { useEffect, useState } from 'react';
import { Mail, MapPin, Clock, Send } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface CMSPage {
  id: string;
  slug: string;
  title: string;
  content: string;
  meta_description: string | null;
}

export const Contact = () => {
  const [page, setPage] = useState<CMSPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    website: '', // Honeypot field
  });
  const [formLoadTime] = useState(Date.now());

  useEffect(() => {
    loadPage();
  }, []);

  const loadPage = async () => {
    const { data } = await supabase
      .from('cms_pages')
      .select('*')
      .eq('slug', 'contact')
      .eq('is_published', true)
      .single();

    if (data) {
      setPage(data);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError(null);
    setSuccess(false);

    // Anti-spam checks
    if (formData.website) {
      // Honeypot triggered
      setError('Er is een fout opgetreden. Probeer het later opnieuw.');
      setSending(false);
      return;
    }

    const timeSinceLoad = (Date.now() - formLoadTime) / 1000;
    if (timeSinceLoad < 3) {
      // Form submitted too quickly (likely a bot)
      setError('Wacht even voordat je het formulier verstuurt.');
      setSending(false);
      return;
    }

    try {
      const { error: dbError } = await supabase
        .from('contact_messages')
        .insert({
          name: formData.name,
          email: formData.email,
          subject: formData.subject,
          message: formData.message,
        });

      if (dbError) {
        throw new Error(dbError.message);
      }

      try {
        const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-contact-message`;
        await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });
      } catch (emailError) {
        console.warn('Email notification failed:', emailError);
      }

      setSuccess(true);
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
        website: '',
      });
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err instanceof Error ? err.message : 'Er is een fout opgetreden');
    } finally {
      setSending(false);
    }
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
        <h1 className="text-4xl md:text-5xl font-bold mb-8">
          {page?.title || 'Contact'}
        </h1>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold mb-6">Stuur ons een bericht</h2>

            {success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <p className="text-green-800">
                  Bedankt voor je bericht! We nemen zo snel mogelijk contact met je op.
                </p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-800">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-semibold mb-2">
                  Naam *
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-semibold mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-semibold mb-2">
                  Onderwerp *
                </label>
                <input
                  type="text"
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-semibold mb-2">
                  Bericht *
                </label>
                <textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  required
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent resize-none"
                />
              </div>

              {/* Honeypot field - hidden from users, but bots will fill it */}
              <div style={{ position: 'absolute', left: '-9999px', opacity: 0, pointerEvents: 'none' }} aria-hidden="true">
                <label htmlFor="website">Website</label>
                <input
                  type="text"
                  id="website"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                />
              </div>

              <button
                type="submit"
                disabled={sending}
                className="w-full bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {sending ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Verzenden...
                  </>
                ) : (
                  <>
                    <Send size={20} />
                    Verstuur bericht
                  </>
                )}
              </button>
            </form>
          </div>

          <div>
            <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
              <h2 className="text-2xl font-bold mb-4">Contactgegevens</h2>
              <div className="prose prose-lg max-w-none">
                <div className="whitespace-pre-wrap text-gray-700 leading-relaxed text-sm">
                  {page?.content || 'Geen content beschikbaar'}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6 flex flex-col items-center text-center">
            <div className="bg-black text-white p-4 rounded-full mb-4">
              <Mail size={28} />
            </div>
            <h3 className="font-semibold mb-2">Email</h3>
            <a
              href="mailto:info@cultheld.nl"
              className="text-sm text-gray-600 hover:text-black transition-colors"
            >
              info@cultheld.nl
            </a>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 flex flex-col items-center text-center">
            <div className="bg-black text-white p-4 rounded-full mb-4">
              <Clock size={28} />
            </div>
            <h3 className="font-semibold mb-2">Openingstijden</h3>
            <p className="text-sm text-gray-600">
              Ma-Vr: 09:00 - 17:00
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 flex flex-col items-center text-center">
            <div className="bg-black text-white p-4 rounded-full mb-4">
              <MapPin size={28} />
            </div>
            <h3 className="font-semibold mb-2">Locatie</h3>
            <p className="text-sm text-gray-600">
              Groningen, Nederland
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

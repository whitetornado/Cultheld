import { useState } from 'react';
import { Mail, MapPin, Clock, Send, Phone } from 'lucide-react';

export const Contact = () => {
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
      // The edge function is the only writer of contact_messages (it runs
      // with the service role, applies rate limiting/spam scoring, and
      // sends the notification email) — there's no direct client-side
      // insert here, since the anon key is intentionally not allowed to
      // write to that table (see the RLS policy in
      // 20260201222411_fix_contact_messages_rls_policy.sql).
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-contact-message`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Er is een fout opgetreden bij het verzenden');
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

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-3">Contact</h1>
          <p className="text-lg text-gray-600">
            Heb je een vraag over je bestelling of onze producten? We helpen je graag.
          </p>
        </div>

        <div className="grid md:grid-cols-5 gap-8">
          <div className="md:col-span-3 bg-white rounded-lg shadow-sm p-8">
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
              <div className="grid sm:grid-cols-2 gap-4">
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

          <div className="md:col-span-2 bg-white rounded-lg shadow-sm p-8 h-fit">
            <h2 className="text-2xl font-bold mb-6">Contactgegevens</h2>

            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="bg-black text-white p-3 rounded-full h-fit flex-shrink-0">
                  <Mail size={20} />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Email</h3>
                  <a
                    href="mailto:info@cultheld.nl"
                    className="text-sm text-gray-600 hover:text-black transition-colors"
                  >
                    info@cultheld.nl
                  </a>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="bg-black text-white p-3 rounded-full h-fit flex-shrink-0">
                  <Phone size={20} />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Telefoon</h3>
                  <a
                    href="tel:+31850602410"
                    className="text-sm text-gray-600 hover:text-black transition-colors"
                  >
                    +31 85 060 2410
                  </a>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="bg-black text-white p-3 rounded-full h-fit flex-shrink-0">
                  <Clock size={20} />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Klantenservice</h3>
                  <p className="text-sm text-gray-600">Ma-Vr: 09:00 - 17:00</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="bg-black text-white p-3 rounded-full h-fit flex-shrink-0">
                  <MapPin size={20} />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Adres</h3>
                  <address className="text-sm text-gray-600 not-italic leading-relaxed">
                    Cultheld
                    <br />
                    Stavangerweg 21-9
                    <br />
                    9723 JC Groningen
                    <br />
                    Nederland
                  </address>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

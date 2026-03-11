import { motion } from "framer-motion";
import { Mail, Phone, MapPin, MessageCircle } from "lucide-react";
import { useState } from "react";
import FloatingNav from "@/components/website/FloatingNav";
import VideoHero from "@/components/website/VideoHero";
import WebsiteFooter from "@/components/website/WebsiteFooter";

const fade = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } };

const contactMethods = [
  {
    icon: MessageCircle,
    title: "WhatsApp",
    value: "Chat with us",
    href: "https://wa.me/972500000000",
    color: "text-green-400",
  },
  {
    icon: Phone,
    title: "Phone",
    value: "+972 50-000-0000",
    href: "tel:+972500000000",
    color: "text-primary",
  },
  {
    icon: Mail,
    title: "Email",
    value: "hello@onflick.com",
    href: "mailto:hello@onflick.com",
    color: "text-blue-400",
  },
  {
    icon: MapPin,
    title: "Location",
    value: "Israel",
    href: "#",
    color: "text-yellow-400",
  },
];

const WebsiteContact = () => {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Placeholder — hook up to backend later
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <FloatingNav />

      {/* Hero */}
      <section className="relative pt-32 pb-16 px-6">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        <div className="relative max-w-4xl mx-auto text-center">
          <motion.h1
            className="font-display text-5xl md:text-7xl lg:text-8xl tracking-wider mb-6"
            initial="hidden"
            animate="visible"
            variants={fade}
            transition={{ duration: 0.8 }}
          >
            GET IN <span className="text-primary">TOUCH</span>
          </motion.h1>
          <motion.p
            className="text-lg text-white/60 max-w-xl mx-auto"
            initial="hidden"
            animate="visible"
            variants={fade}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Have a question, want to collaborate, or just want to say what's up? We'd love to hear from you.
          </motion.p>
        </div>
      </section>

      <section className="px-6 pb-24">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12">
          {/* Contact methods */}
          <div className="space-y-4">
            <motion.h2
              className="font-display text-2xl tracking-wider mb-6"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fade}
            >
              REACH <span className="text-primary">US</span>
            </motion.h2>
            {contactMethods.map((method, i) => (
              <motion.a
                key={method.title}
                href={method.href}
                target={method.href.startsWith("http") ? "_blank" : undefined}
                rel="noopener noreferrer"
                className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 hover:border-primary/30 transition-colors"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fade}
                transition={{ duration: 0.4, delay: i * 0.1 }}
              >
                <method.icon className={`h-6 w-6 ${method.color} shrink-0`} />
                <div>
                  <div className="text-sm text-white/40">{method.title}</div>
                  <div className="text-white font-medium">{method.value}</div>
                </div>
              </motion.a>
            ))}
          </div>

          {/* Contact form */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fade}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h2 className="font-display text-2xl tracking-wider mb-6">
              SEND A <span className="text-primary">MESSAGE</span>
            </h2>
            {sent ? (
              <div className="rounded-2xl border border-primary/30 bg-primary/10 p-10 text-center">
                <div className="text-4xl mb-3">🏀</div>
                <h3 className="font-display text-2xl tracking-wider mb-2">MESSAGE SENT!</h3>
                <p className="text-white/50 text-sm">We'll get back to you soon.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <input
                    type="text"
                    placeholder="Your Name"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-white placeholder:text-white/30 focus:border-primary/50 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <input
                    type="email"
                    placeholder="Your Email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-white placeholder:text-white/30 focus:border-primary/50 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <textarea
                    placeholder="Your Message"
                    required
                    rows={5}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-white placeholder:text-white/30 focus:border-primary/50 focus:outline-none transition-colors resize-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full rounded-xl bg-primary py-3.5 font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Send Message
                </button>
              </form>
            )}
          </motion.div>
        </div>
      </section>

      <WebsiteFooter />
    </div>
  );
};

export default WebsiteContact;

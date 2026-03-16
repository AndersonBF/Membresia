import Link from "next/link"
import {
  MapPin, Phone, Instagram, Facebook, Youtube,
  MessageCircle, Clock, ArrowLeft, Globe,
  BookOpen, Users, Calendar,
} from "lucide-react"

export default function AboutPage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=Playfair+Display:wght@400;600;700&display=swap');

        .ab { font-family: 'DM Sans', sans-serif; }
        .ab-serif { font-family: 'Playfair Display', serif; }

        @keyframes ab-in {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .ab-in { animation: ab-in 0.5s cubic-bezier(.22,1,.36,1) both; }
        .d1{animation-delay:.04s} .d2{animation-delay:.10s} .d3{animation-delay:.16s}
        .d4{animation-delay:.22s} .d5{animation-delay:.28s} .d6{animation-delay:.34s}

        .soc-btn {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 10px 18px; border-radius: 12px; font-size: 13px;
          font-weight: 600; transition: transform .15s, box-shadow .15s;
          text-decoration: none;
        }
        .soc-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,.12); }

        .culto-card {
          background: white; border: 1px solid #e5e7eb;
          border-radius: 16px; padding: 20px 24px;
          transition: box-shadow .2s, transform .2s;
        }
        .culto-card:hover { box-shadow: 0 8px 28px rgba(0,0,0,.08); transform: translateY(-2px); }

        .verse-bar {
          background: linear-gradient(135deg, #14532d 0%, #166534 50%, #15803d 100%);
          position: relative; overflow: hidden;
        }
        .verse-bar::before {
          content: ''; position: absolute; inset: 0;
          background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
        }

        .info-row { display: flex; align-items: flex-start; gap: 14px; padding: 16px 0; border-bottom: 1px solid #f3f4f6; }
        .info-row:last-child { border-bottom: none; }
      `}} />

      <div className="ab bg-gray-50 min-h-screen">

        {/* ── HERO ── */}
        <div className="verse-bar ab-in d1">
          <div className="px-6 md:px-10 pt-6 pb-12">
            <Link href="/member"
              className="inline-flex items-center gap-1.5 text-white/40 hover:text-white/70 text-xs transition mb-8">
              <ArrowLeft size={13} /> Voltar
            </Link>

            <div className="max-w-2xl">
              <p className="text-green-300/70 text-xs font-semibold uppercase tracking-widest mb-3">
                Desde 1996 · Toledo, Paraná
              </p>
              <h1 className="ab-serif text-white font-bold leading-tight mb-4"
                style={{ fontSize: "clamp(2.2rem,6vw,4rem)" }}>
                Igreja Presbiteriana<br />de Toledo
              </h1>
              <p className="text-white/50 text-sm leading-relaxed max-w-lg">
                Confessionais, Reformados, centrados na Bíblia Sagrada.
                Federada à Igreja Presbiteriana do Brasil — IPB.
              </p>
            </div>
          </div>
          <div style={{ height: 2, background: "linear-gradient(90deg, #4ade80, #4ade8055, transparent)" }} />
        </div>

        {/* ── VERSÍCULO ── */}
        <div className="ab-in d2 bg-green-800 px-6 md:px-10 py-5 flex items-center gap-4">
          <BookOpen size={18} className="text-green-300 shrink-0" />
          <p className="text-white/80 text-sm italic">
            "Jesus Cristo é o mesmo, ontem, e hoje, e eternamente."
            <span className="text-green-400 ml-2 not-italic font-semibold text-xs">Hebreus 13:8</span>
          </p>
        </div>

        {/* ── BODY ── */}
        <div className="p-4 md:p-6 flex flex-col gap-6 max-w-4xl">

          {/* Sobre */}
          <section className="ab-in d2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-2.5 mb-4">
              <span className="w-0.5 h-5 rounded-full bg-green-700 block" />
              <h2 className="text-lg font-semibold text-gray-900">Sobre a Igreja</h2>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed mb-3">
              Nosso trabalho na cidade começou em <strong>1990</strong>, e nos tornamos uma Igreja organizada
              em <strong>19 de novembro de 1996</strong>. Desde então, temos trabalhado para a glória de Deus,
              pregando o Evangelho da cruz de Jesus Cristo.
            </p>
            <p className="text-gray-600 text-sm leading-relaxed">
              Somos uma Igreja de raiz e fé reformada, subscrita aos símbolos de Fé de Westminster.
              Como Igreja Reformada, cremos e vivemos os princípios da Reforma Protestante:
              <span className="text-green-700 font-medium"> Somente as Escrituras, Somente a Graça, Somente a Fé, Somente Cristo, Somente a Deus Glória.</span>
            </p>

            {/* Pilares */}
            <div className="grid grid-cols-3 gap-3 mt-5">
              {[
                { icon: BookOpen, label: "Reformados", sub: "Fé de Westminster" },
                { icon: Users,    label: "Comunidade", sub: "Desde 1996" },
                { icon: Calendar, label: "Federada",   sub: "IPB — Brasil" },
              ].map(({ icon: Icon, label, sub }) => (
                <div key={label} className="flex flex-col items-center text-center p-3 rounded-xl bg-green-50 border border-green-100">
                  <Icon size={18} className="text-green-700 mb-1.5" />
                  <p className="text-xs font-semibold text-gray-800">{label}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">{sub}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Pastor */}
          <section className="ab-in d3 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-2.5 mb-5">
              <span className="w-0.5 h-5 rounded-full bg-green-700 block" />
              <h2 className="text-lg font-semibold text-gray-900">Liderança Pastoral</h2>
            </div>
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center shrink-0 text-2xl font-bold text-green-700 border-2 border-green-200">
                JR
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-green-700 mb-0.5">
                  Pastor Titular
                </p>
                <p className="font-bold text-gray-900 text-base leading-snug">
                  Rev. José Ricardo Azevedo Capelari
                </p>
                <p className="text-gray-500 text-xs mt-1 leading-relaxed">
                  Formado em Teologia pelo Seminário Teológico Sul Americano e em História pela UEM.
                  Pastoreia a IPB Toledo desde <strong>janeiro de 2015</strong>.
                </p>
              </div>
            </div>
          </section>

          {/* Horários */}
          <section className="ab-in d3 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-2.5 mb-5">
              <span className="w-0.5 h-5 rounded-full bg-green-700 block" />
              <h2 className="text-lg font-semibold text-gray-900">Horários de Culto</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { dia: "Domingo",       icone: "🌅", cultos: [
                  { hora: "09h00", nome: "Escola Bíblica Dominical" },
                  { hora: "18h00", nome: "Culto de Adoração" },
                ]},
                { dia: "Quarta-feira",  icone: "🙏", cultos: [
                  { hora: "19h30", nome: "Culto de Oração" },
                ]},
              ].map(({ dia, icone, cultos }) => (
                <div key={dia} className="culto-card">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">{icone}</span>
                    <p className="font-semibold text-gray-800 text-sm">{dia}</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    {cultos.map(c => (
                      <div key={c.nome} className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Clock size={11} className="text-green-600" />
                          <span className="text-green-700 font-bold text-xs">{c.hora}</span>
                        </div>
                        <span className="text-gray-600 text-xs">{c.nome}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-gray-400 mt-3 text-center">
              * Confirme os horários atualizados pelo WhatsApp ou redes sociais
            </p>
          </section>

          {/* Endereço + Mapa */}
          <section className="ab-in d4 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 pb-4">
              <div className="flex items-center gap-2.5 mb-4">
                <span className="w-0.5 h-5 rounded-full bg-green-700 block" />
                <h2 className="text-lg font-semibold text-gray-900">Localização</h2>
              </div>
              <div className="info-row">
                <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
                  <MapPin size={15} className="text-green-700" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">Rua Rui Barbosa, 2966</p>
                  <p className="text-xs text-gray-500">Jardim Gisela — Toledo / PR · CEP 85905-060</p>
                  <p className="text-xs text-gray-400 mt-0.5">Em frente ao INSS</p>
                </div>
              </div>
              <div className="info-row">
                <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
                  <Phone size={15} className="text-green-700" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">(45) 3054-6767</p>
                  <p className="text-xs text-gray-500">Telefone / WhatsApp</p>
                </div>
              </div>
            </div>

            {/* Google Maps embed */}
            <div className="w-full" style={{ height: 240 }}>
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3641.123!2d-53.7420!3d-24.7260!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94f3e3b6c3a3a3a3%3A0x1234567890abcdef!2sRua%20Rui%20Barbosa%2C%202966%20-%20Jardim%20Gisela%2C%20Toledo%20-%20PR%2C%2085905-060!5e0!3m2!1spt-BR!2sbr!4v1234567890"
                width="100%"
                height="240"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>

            <div className="p-4">
              <a
                href="https://maps.google.com/?q=Rua+Rui+Barbosa,+2966,+Jardim+Gisela,+Toledo,+PR"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-green-700 border border-green-200 hover:bg-green-50 transition"
              >
                <MapPin size={14} /> Abrir no Google Maps
              </a>
            </div>
          </section>

          {/* Redes Sociais */}
          <section className="ab-in d5 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-2.5 mb-5">
              <span className="w-0.5 h-5 rounded-full bg-green-700 block" />
              <h2 className="text-lg font-semibold text-gray-900">Redes Sociais & Contato</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <a href="https://instagram.com/ipbtoledo" target="_blank" rel="noopener noreferrer"
                className="soc-btn"
                style={{ background: "linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)", color: "#fff" }}>
                <Instagram size={15} /> Instagram
              </a>
              <a href="https://facebook.com/ipbtoledo" target="_blank" rel="noopener noreferrer"
                className="soc-btn"
                style={{ background: "#1877f2", color: "#fff" }}>
                <Facebook size={15} /> Facebook
              </a>
              <a href="https://youtube.com/ipbtoledo" target="_blank" rel="noopener noreferrer"
                className="soc-btn"
                style={{ background: "#ff0000", color: "#fff" }}>
                <Youtube size={15} /> YouTube
              </a>
              <a href="https://wa.me/554530546767" target="_blank" rel="noopener noreferrer"
                className="soc-btn"
                style={{ background: "#25d366", color: "#fff" }}>
                <MessageCircle size={15} /> WhatsApp
              </a>
              <a href="https://toledo.ipb.org.br" target="_blank" rel="noopener noreferrer"
                className="soc-btn"
                style={{ background: "#14532d", color: "#fff" }}>
                <Globe size={15} /> Site Oficial
              </a>
            </div>
          </section>

          {/* Rodapé */}
          <div className="ab-in d6 text-center py-4">
            <p className="text-xs text-gray-400">
              Igreja Presbiteriana de Toledo · IPB · CNPJ 02.777.600/0001-96
            </p>
          </div>

        </div>
      </div>
    </>
  )
}
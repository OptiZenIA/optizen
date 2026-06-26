// ============================================================================
//  OptiZen — Fonction serverless pour le chat IA (Claude / Anthropic)
// ============================================================================
//
//  Déploiement (Vercel) :
//    1. npm install @anthropic-ai/sdk
//    2. Définir la variable d'environnement ANTHROPIC_API_KEY
//       (Vercel → Project → Settings → Environment Variables)
//    3. Déployer : ce fichier est exposé automatiquement sur /api/chat
//    4. Dans index.html, passer CONFIG.USE_AI à true (le widget appellera /api/chat)
//
//  Netlify : placer ce fichier dans netlify/functions/chat.js et adapter
//  l'export (exports.handler) — la logique Anthropic reste identique.
//
//  Coût : payant à l'usage. La clé reste côté serveur → jamais exposée au client.
// ============================================================================

import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic(); // lit ANTHROPIC_API_KEY depuis l'environnement

// Personnalité de l'assistant OptiZen
const SYSTEM_PROMPT = `Tu es l'assistant virtuel d'OptiZen, une agence qui aide les TPE et PME
dans leur transformation digitale : création de sites web modernes, intelligence artificielle
et automatisation. Le fondateur est Adrien (26 ans).

Services : sites web (vitrine, e-commerce, refonte), chatbots & assistants IA,
automatisation (CRM, emails, prospection), optimisation digitale (SEO, conversion).
Délai moyen de livraison d'un site : 14 jours. Chaque projet est sur-mesure.
Contact : optizen.eu@gmail.com · 06 14 91 61 72.

Réponds en français, de façon chaleureuse, concise et professionnelle. Mets en valeur OptiZen
sans être insistant, et oriente vers un appel ou un contact avec Adrien quand c'est pertinent.
N'invente jamais de tarifs précis : propose un échange gratuit pour une estimation.`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  try {
    const { message, history = [] } = req.body || {};
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Message manquant" });
    }

    // Construit l'historique de conversation (rôles user/assistant uniquement)
    const messages = history
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({ role: m.role, content: String(m.content) }));

    // Sécurité : le dernier message doit être celui de l'utilisateur
    if (messages.length === 0 || messages[messages.length - 1].role !== "user") {
      messages.push({ role: "user", content: message });
    }

    const response = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages,
    });

    const reply = response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n")
      .trim();

    return res.status(200).json({ reply });
  } catch (err) {
    console.error("Erreur chat OptiZen :", err);
    return res.status(500).json({
      reply:
        "Désolé, une erreur est survenue. Contactez Adrien au 06 14 91 61 72 ou optizen.eu@gmail.com.",
    });
  }
}

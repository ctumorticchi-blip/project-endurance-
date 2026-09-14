import { Link } from 'react-router-dom'
import { brand } from '@/config/brand'
import { Card } from '@/shared/components/Card'

/**
 * Written to match what the app actually does today (`docs/architecture.md`:
 * everything lives in the browser's local storage, no backend, no
 * account), not a generic template — the "M2 Cloud & Compte" roadmap
 * entry is the one thing here that will need a real rewrite once it
 * ships, flagged explicitly rather than glossed over.
 */
export function PrivacyPolicyPage() {
  return (
    <div className="flex flex-col gap-5 px-4 py-6">
      <div>
        <h1 className="text-lg font-semibold">Politique de confidentialité</h1>
        <p className="text-sm text-text-muted">Comment {brand.name} traite tes données.</p>
      </div>

      <Card variant="raised" className="flex flex-col gap-1 text-sm">
        <h2 className="font-semibold">Le principe : rien ne quitte ton appareil</h2>
        <p className="text-text-muted">
          {brand.name} fonctionne entièrement en local. Ton profil, tes disponibilités, ton
          programme, ton historique de séances et tes préférences nutrition sont stockés
          uniquement dans le stockage local de ton navigateur, sur cet appareil. Il n'y a pas de
          compte, pas de serveur applicatif, et aucune de ces données n'est envoyée où que ce soit
          ni partagée avec un tiers.
        </p>
      </Card>

      <Card variant="muted" className="flex flex-col gap-1 text-sm">
        <h2 className="font-semibold">Aucun suivi, aucune mesure d'audience</h2>
        <p className="text-text-muted">
          L'app n'utilise ni cookie de traçage, ni outil d'analytics, ni publicité.
        </p>
      </Card>

      <Card variant="muted" className="flex flex-col gap-1 text-sm">
        <h2 className="font-semibold">Données de santé déclarées</h2>
        <p className="text-text-muted">
          Poids, taille, sexe, fréquence cardiaque, FTP et autres métriques que tu renseignes
          restent soumis au même principe : stockées localement, jamais transmises. Elles ne
          servent qu'à calculer tes zones d'entraînement et tes repères nutrition à l'intérieur de
          l'app.
        </p>
      </Card>

      <Card variant="muted" className="flex flex-col gap-1 text-sm">
        <h2 className="font-semibold">Tes droits</h2>
        <p className="text-text-muted">
          Comme toutes tes données restent sur ton appareil, tu en gardes le contrôle total à tout
          moment :
        </p>
        <ul className="ml-4 list-disc text-text-muted">
          <li>Les consulter : directement dans l'app (Profil, Progrès, Programme...).</li>
          <li>
            Les supprimer : le bouton « Réinitialiser mon profil » dans Profil efface tout ; vider
            les données de site de ton navigateur produit le même effet.
          </li>
          <li>Les exporter : pas encore disponible aujourd'hui.</li>
        </ul>
      </Card>

      <Card variant="muted" className="flex flex-col gap-1 text-sm">
        <h2 className="font-semibold">Ce qui va changer</h2>
        <p className="text-text-muted">
          Une évolution prévue du produit (compte et synchronisation optionnelle entre appareils)
          impliquera de stocker certaines données sur un serveur. Cette politique sera mise à jour
          avant l'activation de cette fonctionnalité, avec le détail précis de ce qui serait alors
          conservé côté serveur, pour quelle durée, et avec quels moyens de suppression.
        </p>
      </Card>

      <Card variant="muted" className="flex flex-col gap-1 text-sm">
        <h2 className="font-semibold">Contact</h2>
        <p className="text-text-muted">À compléter — adresse de contact pour toute question vie privée.</p>
      </Card>

      <Link to="/legal/mentions-legales" className="text-sm font-medium text-accent underline">
        Mentions légales
      </Link>
      <Link to="/profile" className="text-sm font-medium text-accent underline">
        Retour au profil
      </Link>
    </div>
  )
}

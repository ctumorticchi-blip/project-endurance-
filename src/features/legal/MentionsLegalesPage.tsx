import { Link } from 'react-router-dom'
import { brand } from '@/config/brand'
import { Card } from '@/shared/components/Card'

/**
 * Deliberately honest about what's still a placeholder rather than
 * inventing a legal entity, address, or SIRET that doesn't exist yet —
 * same convention as `brand.ts` ("commercial name not finalized"). This
 * page needs real values filled in before any public launch; shipping
 * fabricated legal information would be worse than shipping none.
 */
export function MentionsLegalesPage() {
  return (
    <div className="flex flex-col gap-5 px-4 py-6">
      <div>
        <h1 className="text-lg font-semibold">Mentions légales</h1>
        <p className="text-sm text-text-muted">
          {brand.name} est un projet en développement, pas encore une structure commerciale
          enregistrée. Cette page sera complétée avec les informations légales définitives avant
          toute mise en production publique.
        </p>
      </div>

      <Card variant="muted" className="flex flex-col gap-1 text-sm">
        <h2 className="font-semibold">Éditeur</h2>
        <p className="text-text-muted">
          À compléter — raison sociale, forme juridique, numéro SIRET, adresse du siège, contact.
        </p>
      </Card>

      <Card variant="muted" className="flex flex-col gap-1 text-sm">
        <h2 className="font-semibold">Hébergement</h2>
        <p className="text-text-muted">
          À compléter — nom et adresse de l'hébergeur, une fois le service de déploiement choisi.
        </p>
      </Card>

      <Card variant="muted" className="flex flex-col gap-1 text-sm">
        <h2 className="font-semibold">Directeur de la publication</h2>
        <p className="text-text-muted">À compléter.</p>
      </Card>

      <Card variant="raised" className="flex flex-col gap-1 text-sm">
        <h2 className="font-semibold">Avertissement santé</h2>
        <p className="text-text-muted">
          Les programmes générés par {brand.name} sont des recommandations d'entraînement
          générales et n'ont pas vocation à remplacer un avis médical. Consulte un professionnel
          de santé avant de commencer un nouveau programme d'entraînement, en particulier en cas
          de doute sur ton état de santé.
        </p>
      </Card>

      <Link to="/legal/confidentialite" className="text-sm font-medium text-accent underline">
        Politique de confidentialité
      </Link>
      <Link to="/profile" className="text-sm font-medium text-accent underline">
        Retour au profil
      </Link>
    </div>
  )
}

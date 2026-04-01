'use client';

export function LegalPage({ type, onClose, t }) {
  // type: 'mentions' or 'privacy'

  const content = type === 'mentions' ? (
    <>
      <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 20 }}>Mentions légales</h2>
      
      <Section title="Éditeur du site">
        <P>LeSifflet — Le verdict des supporters</P>
        <P>Site accessible à l'adresse : www.lesifflet.com</P>
        <P>Contact : contact@lesifflet.com</P>
      </Section>

      <Section title="Hébergement">
        <P>Le site est hébergé par Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis.</P>
        <P>Site web : vercel.com</P>
      </Section>

      <Section title="Propriété intellectuelle">
        <P>L'ensemble du contenu du site LeSifflet (textes, graphismes, logo, icônes, images, code source) est la propriété exclusive de l'éditeur, sauf mention contraire. Toute reproduction, représentation, modification ou exploitation non autorisée est interdite.</P>
        <P>Les logos, noms et blasons des clubs de football appartiennent à leurs propriétaires respectifs et sont utilisés à des fins d'information.</P>
      </Section>

      <Section title="Données sportives">
        <P>Les données sportives (matchs, scores, compositions) sont fournies par football-data.org. LeSifflet ne garantit pas l'exactitude en temps réel de ces données.</P>
      </Section>

      <Section title="Responsabilité">
        <P>LeSifflet ne saurait être tenu responsable des dommages directs ou indirects résultant de l'utilisation du site. Les notes et commentaires publiés par les utilisateurs n'engagent que leurs auteurs.</P>
      </Section>

      <Section title="Droit applicable">
        <P>Le présent site est soumis au droit français. En cas de litige, les tribunaux français seront seuls compétents.</P>
      </Section>
    </>
  ) : (
    <>
      <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 20 }}>Politique de confidentialité</h2>
      <P style={{ marginBottom: 20, fontStyle: 'italic' }}>Dernière mise à jour : avril 2026</P>

      <Section title="1. Données collectées">
        <P>Lors de la création de votre compte, nous collectons :</P>
        <Li>Votre adresse email</Li>
        <Li>Votre pseudo (nom d'affichage)</Li>
        <Li>Votre mot de passe (stocké de manière chiffrée par Firebase Authentication)</Li>
        <P style={{ marginTop: 8 }}>Lors de l'utilisation de l'application, nous collectons :</P>
        <Li>Vos notes attribuées aux joueurs et matchs</Li>
        <Li>Vos commentaires et réactions</Li>
        <Li>Votre score et classement</Li>
      </Section>

      <Section title="2. Finalité du traitement">
        <P>Vos données sont utilisées pour :</P>
        <Li>Gérer votre compte utilisateur</Li>
        <Li>Sauvegarder vos notes et calculer les moyennes communautaires</Li>
        <Li>Établir le classement des Siffleurs</Li>
        <Li>Améliorer l'application et l'expérience utilisateur</Li>
      </Section>

      <Section title="3. Base légale">
        <P>Le traitement de vos données repose sur votre consentement (création de compte) et l'exécution du service (fonctionnement de l'application).</P>
      </Section>

      <Section title="4. Stockage et sécurité">
        <P>Vos données sont stockées sur les serveurs de Google Firebase (infrastructure Google Cloud Platform), localisés dans l'Union Européenne (région europe-west). Les données sont protégées par les mesures de sécurité de Google Firebase, notamment le chiffrement en transit et au repos.</P>
      </Section>

      <Section title="5. Partage des données">
        <P>Vos données personnelles ne sont jamais vendues à des tiers. Les données agrégées et anonymisées (moyennes des notes, statistiques générales) peuvent être partagées publiquement dans l'application. Vos notes individuelles sont associées à votre pseudo uniquement.</P>
      </Section>

      <Section title="6. Durée de conservation">
        <P>Vos données sont conservées tant que votre compte est actif. En cas de suppression de compte, vos données personnelles sont supprimées dans un délai de 30 jours. Les notes et moyennes agrégées peuvent être conservées de manière anonymisée.</P>
      </Section>

      <Section title="7. Vos droits (RGPD)">
        <P>Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez des droits suivants :</P>
        <Li>Droit d'accès : obtenir une copie de vos données</Li>
        <Li>Droit de rectification : modifier vos données</Li>
        <Li>Droit de suppression : supprimer votre compte et vos données</Li>
        <Li>Droit de portabilité : récupérer vos données dans un format lisible</Li>
        <Li>Droit d'opposition : vous opposer au traitement de vos données</Li>
        <P style={{ marginTop: 8 }}>Pour exercer ces droits, contactez-nous à : contact@lesifflet.com</P>
      </Section>

      <Section title="8. Cookies">
        <P>LeSifflet utilise uniquement des cookies techniques nécessaires au fonctionnement de l'application (authentification, préférences de thème). Aucun cookie publicitaire ou de tracking n'est utilisé.</P>
      </Section>

      <Section title="9. Contact">
        <P>Pour toute question relative à la protection de vos données : contact@lesifflet.com</P>
      </Section>
    </>
  );

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 200,
      background: t.gradient, overflowY: 'auto',
      fontFamily: "'Outfit', 'DM Sans', sans-serif",
    }}>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '20px 24px 40px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <button onClick={onClose} style={{
            background: t.toggleBg, border: `1px solid ${t.border}`, color: t.text,
            width: 38, height: 38, borderRadius: 12, fontSize: 18, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>←</button>
          <span style={{ fontSize: 16, fontWeight: 700, color: t.text }}>
            {type === 'mentions' ? 'Mentions légales' : 'Confidentialité'}
          </span>
        </div>

        {/* Content */}
        <div style={{ color: t.text }}>{content}</div>
      </div>
    </div>
  );
}

// Helper components
function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, color: 'inherit' }}>{title}</h3>
      {children}
    </div>
  );
}

function P({ children, style = {} }) {
  return (
    <p style={{ fontSize: 13, lineHeight: 1.7, color: 'inherit', opacity: 0.8, marginBottom: 6, ...style }}>
      {children}
    </p>
  );
}

function Li({ children }) {
  return (
    <p style={{ fontSize: 13, lineHeight: 1.7, color: 'inherit', opacity: 0.8, paddingLeft: 16, marginBottom: 4 }}>
      • {children}
    </p>
  );
}

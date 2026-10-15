/* Aux Douces Mains · données du site (faits relevés sur la fiche Google et la page Facebook, 15/10/2026) */
window.ADM = {
  tel: '+33677526018',
  telAff: '06 77 52 60 18',
  mail: 'comalex04@gmail.com',

  /* horaires de la fiche Google : index = Date#getDay() (0 = dimanche) ; null = fermé */
  hours: [
    null,
    null,
    [['15:00', '22:00']],
    [['15:00', '22:00']],
    [['15:00', '22:00']],
    [['15:00', '22:00']],
    [['09:00', '16:00']]
  ],
  days: ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'],

  /* film d'accueil : instant (s) où chaque plan apparaît, durée totale (voir outils/fabriquer-film.py) */
  shots: [0, 3.7, 7.0, 10.3, 13.2, 16.1],
  total: 20.5,
  captions: [
    { n: '01', t: 'Vos mains', x: 'Manucure, pédicure, pose d’ongles' },
    { n: '02', t: 'Votre peau', x: 'Soins du visage Guinot, conseils sur mesure' },
    { n: '03', t: 'Votre regard', x: 'Sourcils, cils, maquillage' },
    { n: '04', t: 'Votre éclat', x: 'Maquillage de fête et de mariage' },
    { n: '05', t: 'Votre douceur', x: 'Épilations, massages, soin minceur' },
    { n: '06', t: 'Bienvenue', x: '22 route des Alpes · La Brillanne' }
  ],

  /* photos de la visionneuse (même ordre que les figures data-lb) */
  photos: [
    { src: 'assets/img/lieu-accueil-2000.webp', w: 2000, h: 1500, alt: 'L’accueil de l’institut, avec les présentoirs Guinot et la cabine de soins au fond' },
    { src: 'assets/img/lieu-onglerie-1300.webp', w: 1300, h: 1733, alt: 'L’espace ongles : poste de manucure, mur de pierre blanche et mur végétal fleuri' },
    { src: 'assets/img/lieu-cabine-1200.webp', w: 1204, h: 915, alt: 'La cabine de soins : table de massage drapée de rouge, poutre en bois et mur de pierre' },
    { src: 'assets/img/lieu-vitrine-1130.webp', w: 1132, h: 848, alt: 'La boutique vue d’en haut : vitrine sur la rue, présentoirs Guinot et poste de manucure' },
    { src: 'assets/img/lieu-comptoir-1600.webp', w: 1600, h: 1376, alt: 'Le comptoir en bois clair, l’escalier et le coin maquillage' }
  ],

  /* avis Google : mots d'origine, seules la ponctuation/espaces et quelques fautes de frappe évidentes
     (« instut », « details », « n' hésitez ») sont normalisés, sans changer le sens ; noms abrégés.
     Originaux dans DONNEES.md. L'avis à 1 étoile de la fiche n'est pas repris (note affichée = note réelle 4,9). */
  avis: [
    { n: 'Anne-sophie P.', when: 'juillet 2023', t: 'Des personnes de confiance, professionnelles, appliquées, résultat toujours parfait. Cliente depuis plus de 10 ans, et toujours autant contente. Je vous recommande cet institut sans hésitez. De vraies perles.' },
    { n: 'Christelle D.', when: 'août 2024', t: 'Douce et attentionné je recommande fortement alexandra. J’avais peur de l’esthéticienne elle m’a mise en confiance. Allez y les yeux fermés et ça fait 2 ans que je vais dans son institut. Elle m’a fait mon maquillage pour le mariage tout simplement wahouuuu' },
    { n: 'Alban A.', when: 'octobre 2024', t: 'Merci Alexandra pour votre professionnalisme, un massage détente made in Alex selon le ressentis, au top du top, de l’accueil à la sortie, un moment d’évasion je ne peux que recommander!!!' },
    { n: 'Lana F.', when: 'octobre 2022', t: 'Un grand merci à Priscilla et Alexandra, pour leur accueil chaleureux et leur professionnalisme. En 5 ans de fidélité je n’ai jamais étais déçu des prestations. Et pour finir son nouvel institut et vraiment magnifique et décoré avec beaucoup de goût. C’est tout simplement à l’image d’Alexandra' },
    { n: 'Samsam S.', when: 'décembre 2024', t: 'Super! Compétente, à l’écoute, et très bonne conseillère en ce qui concerne les soins du visage. La manucure c’est exactement ce que je voulais pareil pour l’épilation des sourcils. J’ai trouvé mon esthéticienne à la Brillanne 👍' },
    { n: 'Rosa H.', when: 'juillet 2022', t: 'Je conseille fortement le salon aux douces mains. Je suis très satisfaite de leurs prestations qu’elle soit pour l’esthétique ou le nouvel appareil minceur qui a eu des résultats impressionnants sur moi. Alexandra et sa binôme sont agréables, souriante et très professionnelle. Je recommande sans hésiter.' },
    { n: 'Sophie B.', when: 'avril 2023', t: 'Toujours très satisfaite des soins apportés par Alexandra. Ambiance chaleureuse, cabine de soin spacieuse et très confortable. Qualité de l’épilation dans les moindres détails. N’hésitez pas' },
    { n: 'Laure M.', when: 'mars 2023', t: 'Super moment plein de douceur. Un institut à l’écoute de ses clientes avec plein de belles petites attentions pour se détendre ! Merci' },
    { n: 'Mickaelle R.', when: 'octobre 2020', t: 'Un accueil chaleureux, des prestations toujours de qualité et des conseils très professionnels… tout y est pour se faire belle et se faire chouchouter. Merci Alexandra !' },
    { n: 'Cécile P.', when: 'novembre 2023', t: 'J’adore cet institut ! Je fais régulièrement des manucures et je ne suis jamais déçue ! C’est une véritable professionnelle qui sait donner de bons conseils et qui sait sublimer les mains !! Allez-y les yeux fermés !' },
    { n: 'Malvina B.', when: 'juin 2023', t: 'Alexandra est super, prestations de qualité. Elle s’occupe de mes soins depuis plus de 6 ans et je suis toujours satisfaite.' },
    { n: 'Anselme P.', when: 'novembre 2024', t: 'Top prestation avec en plus Alexandra pour vous chouchouter… Je vais aux douces mains depuis 6 ans : épilation, soin, tatouage des sourcils. Son travail est soigné et toujours impeccable.' }
  ]
};

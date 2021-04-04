import { remove } from './accents.js'

/*
Ce module comporte :
- une zone "statique" d'échange entre tous les modules : c'est l'objet "global". Principalement il contien la référence de l'objet App.vue
- des fonctions utilitaires : toutes ne sont pas utilisées dans "balance" (mais le sont dans "produits")
*/

// La zone "statique" d'échange entre tous les modules
export const global = {
}

/*
Calcul des codes courts déduits du numéro du produit
On évite des codes courts à deux lettres qui pourraient être des débuts de noms de produits.
On évite les codes courts qui sont affectables explicitement par le gestionnaire des produits pour les pesée en série,
à savoir ceux commençant par W X Y Z
On va donc générer une liste de code courts à partir des 26 lettres selon les règles suivantes :
- deux voyelles de suite : toutefois quelques combinaisons "pourraient" apparaître en début de nom, elles sont exclues.
- deux consonnes de suite : là aussi quelques combinaisons interdites.
*/
// liste des voyelles pouvant apparaître en première et seconde lettres du code court
const v1 = 'AEIOU'
const v2 = 'AEIOUY'

// listes des consommes pouvant apparaître en première et seconde lettres du code court
const c1 = 'BCDFGHJKLMNPQRSTV'
const c2 = 'BCDFGHJKLMNPQRSTVWXZ'

// liste des codes courts qui pouraient appaaraître comme début d'un nom de produit (par exemple 'AI' pour 'Ail' ...)
const non = ['AI', 'AU', 'EU', 'OI', 'OU', 'BL', 'CH', 'FL', 'GL', 'PL', 'SL']

// lisre des codes courts générés
const codes = []

// génération pour ceux commençant par une voyelle et suivi d'une voyelle
for (let i = 0, x1 = ''; (x1 = v1.charAt(i)); i++) {
  for (let j = 0, x2 = ''; (x2 = v2.charAt(j)); j++) {
    const cc = x1 + x2
    if (non.indexOf(cc) === -1) codes.push(cc)
  }
}

// génération pour ceux commençant par une consonne et suivi d'une consonne
for (let i = 0, x1 = ''; (x1 = c1.charAt(i)); i++) {
  for (let j = 0, x2 = ''; (x2 = c2.charAt(j)); j++) {
    const cc = x1 + x2
    if (non.indexOf(cc) === -1) codes.push(cc)
  }
}

/*
Le code court est :
- soit attribué explicitement par le gestionnaire des produits : son nom commence par '[XA]' par exemple où XA est le code court
- soit est celui de rang n dans la liste des codes où n est le reste de la division du numéro de produit (id) par le nombre de codes courts générés.
*/
export function codeCourtDeId (id, nom) {
  const l = nom.indexOf('[')
  return l !== -1 && nom.charAt(l + 3) === ']' ? nom.substring(l + 1, l + 3) : codes[id % codes.length]
}

/*
Comme nom de fichier "modèle" on accepte une combinaison de lettres, chiffres , - et _
Certains codes sont numériques.
Ci-après les deux expressions régulières correspondantes
*/
const regb64u = RegExp(/^[a-zA-Z0-9-_]*$/)
const regChiffres = RegExp(/^\d+$/)

/*
Vérifie qu'un texte ayant une longueur minimale et maximale fixée est bien
un code en base64 de type URL (sans le padding == à la fin)
*/
export function b64u (s, min, max) {
  if (!s || s.length < min || s.length > max) { return false }
  return regb64u.test(s)
}

/* Edition d'un nombre à 2 chiffres avec 0 devant s'il est inférieur à 10 */
function e2(n) { return e2 === 0 ? '00' : (n < 10 ? '0' + n : '' + n) }

/* Date et heure courante en secpndes sous la forme : 2020-03-21_152135 */
export function dateHeure () {
  const d = new Date()
  return d.getFullYear() + '-' + e2(d.getMonth() + 1) + '-' + e2(d.getDate()) + '_' + e2(d.getHours()) + e2(d.getMinutes()) + e2(d.getSeconds())
}

/* Formate un prix donné par un entier en centimes en euro : 3.61 0.45 */
export function formatPrix (p) {
  if (!p || p < 0) { return '0.00' }
  const e = Math.floor(p / 100)
  const c = Math.round(p % 100)
  return '' + e + '.' + (c > 9 ? c : '0' + c)
}

/*
Formate un poids donné en g :
- soit 5g 15g 125g pour les pods inférieur au kg
- soit 12,430Kg pour les pods supérieurs ou égaux au Kg
*/
export function formatPoids (p) {
  if (!p) return '0'
  if (p < 1000) {
    return p.toString() + 'g'
  }
  const kg = Math.floor(p / 1000)
  const g = Math.round(p % 1000)
  return kg + ',' + ((g < 10 ? '00' : (g < 100 ? '0' : '')) + g) + 'Kg'
  // return '13,457Kg'
}

/*
Retourne la valeur entière number d'un string de n chiffres au plus de long mais non vide.
En cas d'erreur retourne false
*/
export function nChiffres(s, n) {
  if (typeof s !== 'string' || s.length === 0 || s.length > n || !regChiffres.test(s)) return false
  return parseInt(s, 10)
}

/*
En argument s est un string donnant un prix en euros 3.45 0.50 par exemple
Retourne le montant entier en centimes OU false si la syntaxe d'entrée n'est pas valide
*/
export function centimes (s) {
  if (typeof s !== 'string' || s.length === 0) return false
  const i = s.indexOf('.')
  let u = ''
  let c = ''
  if (i === -1) {
      u = s
  } else {
    u = s.substring(0, i)
    c = s.substring(i + 1)
  }
  if (!u) u = '0'
  if (!c) c = '0'
  if (!regChiffres.test(u)) return false
  if (!regChiffres.test(c)) return false
  return Math.round(parseFloat(u + '.' + c) * 100)
}

/* EAN13
Le premier paramètre est un code barre à 13 chiffres.
Si le second paramètre p (c'est un nombre) est défini, c'est un poids ou un nombre d'articles
qui va remplacer les 5 chiffres de droite et calculer la clé.
Retourne un couple avec :
- un libellé d'erreur qui commence par 'code-barre' en cas d'erreur (numéricité, clé)
- le code EAN13, soit d'entrée, soit celui d'entrée dont les chiffres du poids ont été remplacés
*/
export function editEAN(ean, p) {
  if (typeof ean !== 'string' || ean.length !== 13) return ['code-barre : doit avoir exactement 13 chiffres', null]
  if (!regChiffres.test(ean)) return ['code-barre : ne doit contenir que des chiffres', null]
  let s = ean
  const ap = typeof p !== 'undefined'
  if (ap) {
    if (typeof p !== 'number' || p < 0 || p > 99999) return ['code-barre : le poids n\'est pas numérique et compris entre 1 et 99999', null]
    const x = '0000' + Math.round(p)
    s = ean.substring(0, 7) + x.substring(x.length - 5) + '0'
  }
  const c = cleEAN(s)
  const cx = s.substring(12)
  if (!ap) {
    return c === cx ? [null, s] : ['code-barre : erreur de clé. Celle calculée est ' + c + ', celle saisie est ' + cx, null]
  } else {
    return s.substring(0, 12) + c
  }
}

/*
Calcul de la clé d'un string EAN13 (bien formé, 13 chiffres)
Les chiffres sont numérotés de droite à gauche;
Soit x, la somme des chiffres pairs et y la somme des chiffres impairs
Calculons z = x +3*y
Soit m le nombre divisible par 10 immédiatement supérieur à z
La somme de contrôle est : m - z

Exemple : 978020113447
x = 4 + 3 + 1 + 2 + 8 + 9 = 27
y = 7 + 4 + 1 + 0 + 0 + 7 = 19
z = 3 * 19 + 27 = 84
m = 90
Somme de contrôle = 90 - 84 = 6
EAN13 ---> 9 780201 134476
*/
export function cleEAN (s) {
  const v = new Array(13)
  for (let i = 0; i < 13; i++) v[i] = s.charCodeAt(i) - 48
  let x = 0
  for (let i = 10; i >= 0; i = i - 2) { x += v[i] }
  let y = 0
  for (let i = 11; i >= 0; i = i - 2) { y += v[i] }
  const z = (3 * y) + x
  const r = z % 10
  let c = 0
  if (r !== 0) {
      const q = Math.floor(z / 10) + 1
      c = (q * 10) - z
  }
  return String.fromCharCode(48 + c)
}

// liste des colonnes ['id', 'nom', 'code-barre', 'prix', 'categorie', 'unite', 'image']

export function decoreArticles (liste, saufErreur, lgn) {
  // lgn = global.lgnomsuretiquette || 32 // Nombre de caractères max apparaissant sur une ligne d'étiquette
  const res = []
  let nberr = 0
  for (let i = 0; i < liste.length; i++) {
    const data = liste[i]
    data.erreurs = []
    data.nomN = ''
    data.nom1 = ''
    data.nom2 = ''
    data.codeCourt = ''
    data.bio = false
    data.prixN = 0
    data.prixS = '0'

    // id
    try {
      // Le code court est, soit explicité en tête du nom, soit calculé depuis l'id
      const n = nChiffres(data.id, 6)
      if (n === false) {
        data.erreurs.push('id non numérique compris entre 1 et 999999')
      } else {
        data.codeCourt = codeCourtDeId(data.id, data.nom)
      }
    } catch (e) {
      data.erreurs.push('id non numérique compris entre 1 et 999999')
    }

    // nom
    if (!data.nom) {
      data.erreurs.push('nom absent')
      data.nom = ''
    } else {
      /*
      Le code court est, soit explicité en tête du nom, soit calculé depuis l'id
      On détermine aussi si c'est BIO et pour un article à l'unité son poids moyen éventuel
      */
      data.codeCourt = codeCourtDeId(data.id, data.nom)
      data.nomN = remove(data.nom.toUpperCase())
      /*
      Calcule les une ou deux lignes de dénomination du produit apparaissant sur l'étiquette
      Une ligne a un nombre maximal de caractères
      Les mots ne sont pas coupés
      */
      const nom = ['', '']
      let j = 0
      const nx = data.nom.trim().split(' ')
      nx.splice(0, 0, '[' + data.codeCourt + ']')
      for (let i = 0; i < nx.length && j < 2; i++) {
        const m = nx[i]
        if (nom[j].length + m.length + 1 < lgn) {
          if (nom[j].length) {
            nom[j] = nom[j] + ' ' + m
          } else {
            nom[j] = m
          }
        } else {
          j++
          if (j < 2) {
            nom[j] = m
          }
        }
      }
      data.nom1 = nom[0] // Première ligne du nom
      data.nom2 = nom[1] // Seconde ligne du nom
      data.bio = (data.nomN.indexOf('BIO') !== -1)
    }

    // prix
    const e = centimes(data.prix)
    if (e === false) {
      data.erreurs.push('prix absent ou n\'est ni un décimal (avec au plus 2 chiffres après le point), ni un entier')
    } else if (e === 0 || e > 999999) {
      data.erreurs.push('prix en centimes nul ou supérieur à 999999')
    } else {
      data.prixN = e
      data.prix = formatPrix(e)
      data.prixS = '' + e
    }

    // unite
    if (!data.unite || (!data.unite.startsWith('Unit') && data.unite !== 'kg')) {
      data.erreurs.push('unite n\'est ni "Unite(s)" ni "Unité(s)" ni "kg"')
    } else {
      data.unite = data.unite.startsWith('Unit') ? 'Unite(s)' : 'kg'
    }

    // code-barre
    const s = data['code-barre']
    if (typeof s !== 'string' || s.length !== 13 || !regChiffres.test(s)) {
      data.erreurs.push('code-barre doit être constitué de 13 chiffres')
    } else {
      const c = cleEAN(s)
      const cx = s.substring(12)
      if (c !== cx) {
        data.erreurs.push('code-barre, clé calculée:' + c + ', clé trouvée:' + cx)
      }
    }

    // image
    if (data.image && data.image.length) {
      try {
        const buffer = Buffer.from(data.image, 'base64')
        if (!buffer) { return 'image mal encodée (pas en base64)' }
      } catch (err) {
        data.erreurs.push('image mal encodée (pas en base64)')
      }
    } else data.image = ''

    if (data.erreurs.length) nberr++
    if (!data.erreurs.length || !saufErreur) {
      res.push(data)
      data.idx = res.length
    }
  }
  return [nberr, res]
}

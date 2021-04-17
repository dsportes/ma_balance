<template>
  <q-layout id="q-app" view="hHh lpR fFf" class="bg-grey-10">
    <q-header class="text-black bg-grey-2">
      <div class="column">
        <div class="col-auto row">
          <!-- Bouton d'ouverture du menu réservé au coordonnateur -->
          <q-btn :size="standardBtnSize" flat round :color="odooproxy && statusproxy ? 'red' : 'black'" @click="openMenu" icon="menu" aria-label="Menu coordo"/>
          <!-- Zone "poids brut" : soit celui donné par la balance, soit celui saisi par le coordonateur -->
          <div :class="'col row items-center justify-start av-gbtn' + (ecouteBalance ? '2' : ' shadow-5')" v-ripple @click="saisieP()">
            <div :class="'col av-label' + (ecouteBalance ? '2' : '')">Poids brut</div>
            <div class="col-auto column items-center justify-between">
              <div :class="'av-poids' + (ecouteBalance ? '2' : '')">{{format(poidsBalance)}}</div>
              <!-- Filler invisible permettant juste que la zone ne change pas d'aspect quand le bouton "Effacer" est visisble -->
              <div v-if="ecouteBalance || poidsBalance == 0" class="av-box1 self-center"></div>
              <!-- Le bouton "Effacer" le poids saisi est caché quand la balance est active (cas normal) et tant que le poids est 0-->
              <q-btn v-else class="av-box2" size="1rem" color="deep-orange" label="Effacer" @click.stop="poidsBalance = 0"/>
            </div>
          </div>
          <!-- Zone "Poids du contenant"-->
          <div class="col row items-center justify-start av-gbtn shadow-5" v-ripple @click="saisieC()">
            <div class="col-auto column items-center justify-between">
              <div class="av-poids">{{format(poidsContenant)}}</div>
              <!-- Filler invisible permettant juste que la zone ne change pas d'aspect quand le bouton "Effacer" est visisble -->
              <div v-if="poidsContenant == 0" class="av-box1 self-center"></div>
              <!-- Le bouton "Effacer" le poids du contanant est caché tant que le poids est 0 -->
              <q-btn v-else class="av-box2" size="1rem" color="deep-orange" label="Effacer" @click.stop="poidsContenant = 0"/>
            </div>
            <div class="col av-label">Contenant</div>
          </div>
        </div>

        <q-btn v-if="enserie" class="q-mb-xs" style="width:100%;color:white;background:red" @click="finSerie"
          label="Attention : mode impression en série. Pour revenir au mode normal cliquer ici"/>

        <!-- Zone du clavier : deux rangées de lettres -->
        <div class="col-auto row justify-between items-start">
          <div class="col column">
            <div class="col-auto row items-center justify-around av-lettres">
              <div class="av-lettre" v-for="lettre in alphabet1" v-bind:key="lettre" @click="choixLettre(lettre)">
                <span class="av-lettre2" v-ripple >{{lettre}}</span>
              </div>
            </div>
            <div class="col-auto row items-center justify-around label1">
              <div class="av-lettre" v-for="lettre in alphabet2" v-bind:key="lettre" @click="choixLettre(lettre)">
                <span class="av-lettre2" v-ripple >{{lettre}}</span>
              </div>
            </div>
          </div>
          <!-- Zone d'affichage du code court (ou des 2 premières lettres du produit) -->
          <div class="col-auto column items-center justify-between av-codeCourt1">
            <div class="av-codeCourt"><span class="av-lettre2">{{codeCourt}}</span></div>
            <!-- Filler invisible permettant juste que la zone ne change pas d'aspect quand le bouton "Effacer" est visisble -->
            <div v-if="codeCourt === ''" class="av-box1"></div>
            <!-- Bouton d'effacement du code court (quand il a été saisi) -->
            <q-btn v-else class="av-box2" size="1rem" color="deep-orange" label="Effacer" @click.stop="effaceCode()"/>
          </div>
        </div>

      </div>
    </q-header>

    <!-- Le panneau gauche est le Menu réservé au coordonnateur -->
    <q-drawer v-model="panneauGauche" overlay :width="400" bordered content-class="bg-grey-1">
      <div class="absolute" style="top:0;right:-2rem">
        <!-- Bouton pour refermer le panneau : invisible quand le panneau n'est visible, sinon on en voit quand même un bout -->
        <q-btn v-if="panneauGauche" :size="standardBtnSize" dense round unelevated color="accent" icon="chevron_left" @click="panneauGauche = false"/>
      </div>
      <q-list>
        <q-item>
          <q-btn v-if="odooproxy" label="Recharger les articles depuis Odoo" color="primary" @click="panneauGauche = false; recharger()"/>
        </q-item>
        <!-- Bouton d'activation du mode "Impression en série" -->
        <q-item v-if="!enserie" clickable v-ripple @click="enserie = true;panneauGauche = false">
          <q-item-section avatar><q-icon class="menuButton" :name="'reorder'"/></q-item-section>
          <q-item-section class="menuText">Impression en série</q-item-section>
        </q-item>
        <!-- Bouton de désactivation du mode "Saisie en série" -->
        <q-item v-else clickable v-ripple @click="finSerie();panneauGauche = false">
          <q-item-section avatar><q-icon class="menuButton" :name="'pause'"/></q-item-section>
          <q-item-section class="menuText">Fin du mode impression en série</q-item-section>
        </q-item>
        <q-separator />
        <!-- Passage à la saisie manuelle du poids (balance dite "déconnectée") ou retour à la normale (balance dite "connectée / écoutée")-->
        <q-item v-if="!ecouteBalance" clickable v-ripple @click="reconnecterBalance();panneauGauche = false">
          <q-item-section avatar><q-icon class="menuButton" :name="'check'"/></q-item-section>
          <q-item-section class="menuText">Reconnecter la balance</q-item-section>
        </q-item>
        <q-item v-else clickable v-ripple @click="deconnecterBalance();panneauGauche = false">
          <q-item-section avatar><q-icon class="menuButton" :name="'close'"/></q-item-section>
          <q-item-section class="menuText">Deconnecter la balance</q-item-section>
        </q-item>
        <q-separator />
        <!-- Bouton pour quitter l'application -->
        <q-item clickable class="negative" v-ripple @click="exitApp = true">
          <q-item-section avatar><q-icon class="menuButton" :name="'exit_to_app'"/></q-item-section>
          <q-item-section class="menuText">Quitter l'application</q-item-section>
        </q-item>
        <q-separator/>
        <q-item class="column">
          <div class="col-auto text-h6 bold">Version de l'application : {{ version }}</div>
          <!-- Nombre d'articles du fichier -->
          <div v-if="articles.length == 0" class="col-auto">Pas d'article</div>
          <div v-else class="col-auto">{{articles.length}} articles</div>
          <div class="col-auto">Date-heure des articles: {{ cache.dh }}</div>
          <div class="col-auto">SHA des articles : {{ cache.sha }}</div>
          <div v-if="odooproxy && nberreurs !== 0" class="col-auto">{{ nberreurs }} article() ignorés (en erreur)</div>
          <div v-if="odooproxy && statusproxy" class="col-auto">Etat du proxy : {{ statusproxy }}</div>
          <!-- La balance est en erreur : texte du diagnostic -->
          <div v-if="!ecouteBalance" class="col-auto text-negative">Balance déconnectée, saisie manuelle du poids</div>
          <div v-if="ecouteBalance && erreurBalance" class="col-auto text-negative">{{erreurBalance}}<br>
            <span class="text-deep-orange-8 text-bold">Tenter de reconnecter après avoir vérifier les branchements et que la balance est allumée</span>
          </div>
        </q-item>
      </q-list>
    </q-drawer>

    <!-- Zone centrale : affichage des instructions ou des fiches des produits correspondant au code court -->
    <q-page-container class="av-container">
      <!-- Les 4 messages correspondent à des états différents selon que le produit est ou non sur la balance,
        que le poids du conteant a été saisi ou non et que le code court a été saisi ou non -->
      <div v-if="poidsBalance === 0" class="av-msg  shadow-5">{{ m1 }}</div>
      <div v-if="poidsBalance !== 0 && poidsContenant === 0 && codeCourt.length === 0" class="av-msg shadow-5">{{ m2 }}</div>
      <div v-if="poidsBalance !== 0 && codeCourt.length === 0" class="av-msg shadow-5">{{ m3 }}</div>
      <div v-if="codeCourt.length !== 0 && this.selArticles.length == 0" class="av-msg shadow-5">{{ m4 }}</div>
      <!-- Fiches des articles correspondants au code court -->
      <div v-if="this.selArticles.length !== 0" class="row justify-around">
        <carte-article v-for="article in selArticles" :key="article.idx" :article="article" :pc="poidsContenant" :pb="poidsBalance" @clic-article="clicArticle(article)"></carte-article>
      </div>
    </q-page-container>

    <!-- Boîte de dialogue de sortie de l'application -->
    <q-dialog v-model="exitApp" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="exit_to_app" color="negative" text-color="white"/>
          <span class="q-ml-sm dialogText">Voulez-vous vraiment quitter l'application ?</span>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn size="2.5rem" class="dialogText" flat label="Non, je la garde active" color="primary" v-close-popup
            @click="exitApp = false; panneauGauche = false"/>
          <q-btn size="2.5rem" class="dialogText" flat label="Oui, je l'arrête" color="negative" v-close-popup
            @click="quit()"/>
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Boîte de dialogue générique avec acquittement "J'ai lu" -->
     <q-dialog v-model="alerte">
      <q-card>
        <q-card-section>
          <div class="text-h6">Erreur</div>
        </q-card-section>
        <q-card-section class="q-pt-none">
          {{ texteAlerte }}
        </q-card-section>
        <q-card-actions align="right">
          <q-btn size="2.5rem" flat label="J'ai lu" color="negative" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Boîte de dialogue d'information d'un poids de contenant excessif -->
    <q-dialog v-model="alerteC" persistent>
      <q-card>
        <q-card-section class="q-ml-sm dialogText">
            Le poids du contenant "vide" ne peut pas être supérieur au poids du contenant "rempli"
        </q-card-section>
        <q-card-actions align="right">
          <q-btn size="2.5rem" flat label="J'ai lu" color="negative" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Boîte de dialogue d'information interdisant d'imprimer une étiquette quand rien n'est posé sur la balance -->
    <q-dialog v-model="sanspoids" persistent>
      <q-card>
        <q-card-section class="q-ml-sm dialogText">
            Pas d'article sur la balance, pas détiquette !
        </q-card-section>
        <q-card-actions align="right">
          <q-btn size="2.5rem" flat label="J'ai lu" color="negative" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Boîte de dialogue demandant si la personne derrière l'écran est bien un coordonnateur -->
    <q-dialog v-model="coordo" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <span class="q-ml-sm dialogText">Fonctions réservées aux coordonateurs. L'êtes-vous ?</span>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn size="2.5rem" class="dialogText" flat label="Non" color="negative" v-close-popup
            @click="coordo = false"/>
          <q-btn size="2.5rem" class="dialogText" flat label="Oui, je suis coordonateur" color="primary" v-close-popup
            @click="coordo = false;panneauGauche = true"/>
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Pavé numérique pour la saisie du poids du contenant -->
    <q-dialog v-model="saisiecont" persistent>
      <pave-numerique :valeur="0" @saisie-ok="saisiecontok"></pave-numerique>
    </q-dialog>

    <!-- Pavé numérique pour la saisie du poids brut -->
    <q-dialog v-model="saisiepoids" persistent>
      <pave-numerique :valeur="0" @saisie-ok="saisiepoidsok"></pave-numerique>
    </q-dialog>

    <!-- Pavé numérique pour la saisie du nombre de pièces sur la balance -->
    <q-dialog v-model="saisiepieces" persistent>
      <pave-numerique :valeur="nbpieces" :unites="true" @saisie-ok="saisieunitesok"></pave-numerique>
    </q-dialog>

  </q-layout>
</template>

<script>
const fs = require('fs')
const path = require('path')

import { config } from './app/config'
import { decoreArticles, formatPoids } from './app/global'
import { Balance } from './app/portbalance'
import { etiquette } from './app/zpl'
import { remove } from './app/accents.js'
import Papa from 'papaparse'
import axios from 'axios'

const lgn = config.lgnomsuretiquette || 32 // Nombre de caractères max apparaissant sur une ligne d'étiquette
const cachejson = path.join(config.dir, 'cache.json')

const cache = { dh: '', sha: '', liste: [] }

function setCache() {
  fs.writeFileSync(cachejson, JSON.stringify(cache))
}

// Retourne la date-heure de dernière modification du fichier articles.csv pour détecter son changement
function mtimeArticles () {
    const stats = fs.statSync(config.articles)
    return stats ? stats.mtime.toString() : ''
}

function parse() {
  const mtime = mtimeArticles()
  if (!mtime) {
    return { err: Error('Fichier ' + config.articles + ' inaccessible') }
  }
  const s = fs.readFileSync(config.articles).toString('utf8')
  try {
    const results = Papa.parse(s, { delimiter: ';', header: true })
    console.log('Parsing complete:', results)
    const x = decoreArticles(results.data, true, lgn)
    return { articles: x[1], mtime: mtime }
  } catch (e) {
    return { err: Error('Fichier ' + config.articles + ' inaccessible - ' + e.message) }
  }
}

/* eslint-disable no-unused-vars */
import CarteArticle from './components/CarteArticle.vue'
import PaveNumerique from './components/PaveNumerique.vue'

/*
Pour toutes les saisie du client à l'écran il y a un timeout.
Il peut simplement partir (oyu hésiter très longtemps) et dans ce cas la réponse "négative" est choisie
et la boîte de dialogue, le menu ou le pavé numérique se ferme.
*/
// Time out du clavier numérique. Se ferme et renvoie 0 au delà de ce temps
const toCN = config.timeoutClavierNumerique || 20000

// delai de pooling du changement du fichier articles
const poolingArticles = config.poolingArticles || 10000

// delai maximal de réaction du coordonateur sur son panneau
const toCoordo = config.timeoutCoordo || 10000

const toMenu = config.timeoutMenu || 60000

export default {
  name: 'App',

  components: { CarteArticle, PaveNumerique },

  /*
  A l'initialisation :
  - il faut rechager les articles
  - il faut créer une balance
  - il faut la connecter, c'est à dire la mettre à l'écoute permannente d'un poids
  */
  mounted() {
    if (!config.odooproxy) {
      let stats
      try { stats = mtimeArticles() } catch (e) {}
      if (!stats) config.msgbox('Le serveur local doit être démarré avant le poste balance.', 'Relancer les deux PC dans l\'ordre : serveur PUIS une fois prêt, balance.', true)
    } else {
      let rawdata
      try {
        rawdata = fs.readFileSync(cachejson)
      } catch (e) { }
      if (rawdata) {
        const c = JSON.parse(rawdata)
        cache.liste = c.liste
        cache.dh = c.dh
        cache.sha = c.sha
        const x = decoreArticles(c.liste, true, lgn)
        this.nberreurs = x[0]
        this.articles = x[1]
      }
    }
    console.log('mounted: ' + config.balance)
    this.detectionArticles()
    // La balance est créée avec la méthode de callback à invoquer à chaque fois que le poids change (this.poidsReçu)
    this.balance = new Balance(config.balance, this.poidsRecu)
    this.reconnecterBalance()
  },

  data () {
    return {
      cache: cache,
      odooproxy: config.odooproxy,
      version: config.version, // version de l'application (en production seulement)
      m1: config.message1 || 'Poser les articles sur la balance',
      m2: config.message2 || 'Si les articles sont dans votre "contenant" personnel, appuyer en haut à droite sur "Contenant".\nSi votre contenant n\'a pas été pesé, voir l\'accueil.',
      m3: config.message3 || 'Appuyer sur les deux lettres du code du produit, ou si vous ne les avez pas notées, sur les deux premières lettres de son nom.',
      m4: config.message4 || 'Pas d\'article ayant ce code où commençant par ces lettres.',
      mtime: '', // date-heure de dernière modification du fichiers articles.csv chargé
      largeBtnSize: '2rem', // Taille d'un bouton large (le q-btn n'admet pas un CSS pour ça)
      standardBtnSize: '1.5rem', // Taille d'un bouton standard
      coordo: false, // Le client s'est déclaré coordonnateur
      panneauGauche: false, // Model du panneau gauche "Menu du coordonnateur"
      saisiecont: false, // Model de contrôle du pavé numérique de saisie du poids du contenant
      saisiepoids: false, // Model de contrôle du pavé numérique de saisie du poids brut
      saisiepieces: false, // Model de contrôle du pavé numérique de saisie du nombre de pièces sur la balance
      alerte: false, // Model de contrôle de la boîte de dalogue d'alerte "J'ai lu"
      alerteC: false, // Model de contrôle de la boîte de dalogue d'alerte "Poids du contenant excessif"
      sanspoids: false, // Model de contrôle de la boîte de dialogue avertissant d'une demande d'étiquette sans produit sur la balance
      exitApp: false, // Model de contrôle de la boîte de dialogue demandant la confirmation de la fermeture de l'application
      articles: [], // liste des articles du fichier
      selArticles: [], // sous ensemble des articles sélectionnés par leur code court
      texteAlerte: '', // Texte de l'alerte générique
      erreurBalance: '', // Libellé de l'erreur technique d'accès à la balance
      ecouteBalance: false, // Vrai si la balance est en écoute, faux si elle est "déconnectée", en fait n'est plus écoutée
      poidsBalance: 0, // Poids brut (pesé ou saisi)
      poidsContenant: 0, // Poids du contenant
      nbpieces: 0, // Nombre de pièces sur la balance
      codeCourt: '', // Code court saisi par le client (ou les 2 première lettres du nom - 0 1 ou 2 caractères)
      alphabet1: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M'],
      alphabet2: ['N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'],
      t1: null, // Objet de timeout pour le menu (on peu avoir le menu et une alerte ouverte, d'où t1 et t3)
      t2: null, // Objet générique de Timeout pour les pavés numériques
      t3: null, // Objet de Timeout pour tous les dialogues auxquels le client peut oublier de répondre
      enserie: false, // Mode de saisie en série activé ou non
      nberreurs: 0, // nombre d'erreurs détectées dans le cache Odoo
      statusproxy: '', // message d'erreur du dernier accès au proxy odoo
      mask: false
    }
  },

  watch: {
    // Détection du fait d'avoir posé un article sur la balance
    poidsBalance (apres, avant) {
      if (apres === 0 && avant !== 0) { this.raz() }
    },
    // Détection de l'affirmation que le client est coordonnateur : enclenche le timeout pour répondre non
    coordo (apres, avant) {
      if (apres && !avant) {
        this.t3 = setTimeout(() => {
          this.coordo = false
          if (this.t3) { clearTimeout(this.t3); this.t3 = null }
        }, toCoordo)
      }
    },
    // Détection de l'ouverture du panneau gauche : enclenche le timeout pour le refermer
    panneauGauche (apres) {
      if (apres) {
        this.t1 = setTimeout(() => { this.panneauGauche = false; this.t1 = null }, toMenu)
      } else {
        if (this.t1) { clearTimeout(this.t1); this.t1 = null }
      }
    },
    // Détection de l'ouverture du pavé numérique pour saisir le poids du contenant : enclenche le timeout pour le refermer
    alerteC (apres) {
      if (apres) {
        this.t3 = setTimeout(() => { this.alerteC = false; this.t3 = null }, toCoordo)
      } else {
        if (this.t3) { clearTimeout(this.t3); this.t3 = null }
      }
    },
    // Détection de l'ouverture de la boîte de dialogue d'alerte : enclenche le timeout pour la refermer (J'ai lu)
    alerte (apres) {
      if (apres) {
        this.t3 = setTimeout(() => { this.alerte = false; this.t3 = null }, toCoordo)
      } else {
        if (this.t3) { clearTimeout(this.t3); this.t3 = null }
      }
    },
    // Détection de l'ouverture de la boîte de dialogue pour confirmer la sortie de l'application : enclenche le timeout pour la refermer sans sortir
    exitApp (apres) {
      if (apres) {
        this.t3 = setTimeout(() => { this.exitApp = false; this.t3 = null }, toCoordo)
      } else {
        if (this.t3) { clearTimeout(this.t3); this.t3 = null }
      }
    },
    // Détection de l'ouverture de la boîte de dialogue pour confirmer la lecture du message "demande d'étiquette sans poids" : enclenche le timeout pour la refermer (J'ai lu)
    sanspoids (apres) {
      if (apres) {
        this.t3 = setTimeout(() => { this.sanspoids = false; this.t3 = null }, toCN)
      } else {
        if (this.t3) { clearTimeout(this.t3); this.t3 = null }
      }
    }
  },

  methods: {
    openMenu() {
      if (config.confirmCoordo) {
        this.coordo = true
      } else {
        this.panneauGauche = true
      }
    },
    setMask() {},
    unsetMask() { },

    quit () {
      config.quit()
    },

    // Fin du mode saisie en série, tout est remis à zéro
    finSerie () {
      this.enserie = false
      this.raz()
    },

    // Ouverture du pavé numérique pour la saise du poids du contenant : arme le timeout pour le fermer
    saisieC() {
      this.saisiecont = true
      this.t2 = setTimeout(() => {
        this.saisiecont = false
        this.poidsContenant = 0
        this.t2 = null
      }, toCN)
    },

    // Ouverture du pavé numérique pour la saise du poids brut : arme le timeout pour le fermer
    saisieP() {
      if (this.ecouteBalance) { return }
      this.saisiepoids = true
      this.t2 = setTimeout(() => {
        this.saisiepoids = false
        this.poidsBalance = 0
        this.t2 = null
      }, toCN)
    },

    // Ouverture du pavé numérique pour la saise du nombre de pièces : arme le timeout pour le fermer
    saisieN() {
      this.saisiepieces = true
      this.t2 = setTimeout(() => {
        this.saisiepieces = false
        this.nbpieces = 0
        this.t2 = null
      }, toCN)
    },

    /*
    Détection périodique du changement éventuel du fichier articles.csv ou odoo
    On ne change pas le fichier en cours de pesée
    - quand un code court a été saisi, qu'il y a un poids ou un poids de contenant saisi
    - au milieu d'une pesée en série,
    Ni quand une boîte de dialogue est ouverte
    Relance la détection / chargement en pooling
    */
    async detectionArticles() {
      if (!this.t1 && !this.t2 && !this.t3 && !this.enserie && !this.codeCourt && !this.poidsBalance && !this.poidsContenant) {
        if (config.odooproxy) {
          await this.articlesAPeser(false)
          this.raz()
        } else {
          const mtime = mtimeArticles()
          if (mtime && mtime !== this.mtime) {
            const x = parse()
            // A la fin de la lecture des articles
            if (!x.err) {
              this.articles = x.articles
              this.mtime = x.mtime
              this.raz()
            } else {
              this.texteAlerte = 'Le fichier des articles est corrompu ou absent\n' + config.articles + '\n' + x.err
              this.alerte = true
              this.raz()
            }
          }
        }
      }
      setTimeout(() => {
        this.detectionArticles()
      }, poolingArticles)
    },

    // Effacement du code court : la sélection devient vide
    effaceCode () {
      this.codeCourt = ''
      this.selArticles = []
    },

    /*
    Remise à zéro de tout,
    SAUF en mode de saisie en série où le poids du contenant, le code court et la sélection des articles est conservée
    */
    raz() {
      this.poidsBalance = 0
      if (!this.enserie) {
        this.poidsContenant = 0
        this.codeCourt = ''
        this.selArticles = []
      }
      this.panneauGauche = false
      this.saisiecont = false
      this.saisiepoids = false
      this.saisiepieces = false
      this.alerte = false
      this.alerteC = false
      this.coordo = false
    },

    /*
    Retour du pavé numérique : le poids du contenant est fini d'être saisi
    */
    saisiecontok(p) {
      this.saisiecont = false
      if (this.t2) {
        clearTimeout(this.t2)
        this.t2 = null
      }
      if (p !== -1) {
        if (this.poidsBalance && p >= this.poidsBalance) {
          this.alerteC = true // Attention poids du contenant supérieur au poids brut
        } else {
          this.poidsContenant = p
        }
      }
    },

    /*
    Retour du pavé numérique : le poids brut est fini d'être saisi (manuellement donc, pas par la balance)
    */
    saisiepoidsok(p) {
      this.saisiepoids = false
      if (this.t2) {
        clearTimeout(this.t2)
        this.t2 = null
      }
      if (p !== -1) {
        if (p < this.poidsContenant) {
          this.poidsContenant = 0
          this.alerteC = true
        } else {
          this.poidsBalance = p
        }
      }
    },

    async deconnecterBalance () {
      this.raz()
      await this.balance.finEcoute()
    },

    async reconnecterBalance () {
      await this.balance.debutEcoute()
    },

    /*
    Un nouveau poids a été envoyé par la balance qui donne son état d'écoute, son erreur éventuelle et le poids
    */
    poidsRecu (ecoute, err, poids) {
      this.ecouteBalance = ecoute
      if (err) {
        this.poidsBalance = 0
        this.erreurBalance = err
      } else {
        this.erreurBalance = false
        this.poidsBalance = ecoute ? poids : 0
        if (this.poidsBalance === 0) {
          // Le processus de pesée est réinitialisé à chaque fois que la balance annonce qu'il n'y a rien sur le plateau
          this.raz()
        }
      }
    },

    format (p) { return formatPoids(p) },

    /*
    Le bouton d'une lettre a été apputé sur l'écran tactile : ça complète le code court
    En fait ça ne prend qu'au mieux les deux dernières frappes
    */
    choixLettre(l) {
      this.codeCourt = this.codeCourt + l
      if (this.codeCourt.length === 3) {
        this.codeCourt = this.codeCourt.substring(1)
      }
      this.filtre()
    },

    /*
    Etablit la sélction des articles correspondant au code court frappé ou au deux premières lettres du nom
    La sélection par "code court" vient avant celle par le début du nom pour que les articles apparaissent en priorité
    Le code court peut avoir 1 ou 2 caractères
    */
    filtre() {
      this.selArticles = []
      if (this.codeCourt.length === 0) {
        return
      }
      const sel = [] // pour éviter de voir le même article affiché 2 fois (par son code court et le début de son nom)
      if (this.codeCourt.length === 1) {
        for (let i = 0; i < this.articles.length; i++) {
          const art = this.articles[i]
          if (art.codeCourt.charAt(0) === this.codeCourt) {
            sel.push(art.idx)
            this.selArticles.push(art)
          }
        }
        for (let i = 0; i < this.articles.length; i++) {
          const art = this.articles[i]
          if (sel.indexOf(art.idx) === -1) {
            const nx = remove(art.nom.substring(0, 1).toUpperCase())
            if (this.codeCourt === nx) this.selArticles.push(art)
          }
        }
        return
      }
      for (let i = 0; i < this.articles.length; i++) {
        const art = this.articles[i]
        if (art.codeCourt === this.codeCourt) {
          sel.push(art.idx)
          this.selArticles.push(art)
        }
      }
      for (let i = 0; i < this.articles.length; i++) {
        const art = this.articles[i]
        if (sel.indexOf(art.idx) === -1) {
          const nx = remove(art.nom.substring(0, 2).toUpperCase())
          if (this.codeCourt === nx) this.selArticles.push(art)
        }
      }
    },

    /*
    Clic sur la fiche d'un article
    */
    clicArticle(article) {
      const c1 = article.codeCourt.charAt(0)
      if (this.enserie && c1 < 'W') {
        /*
        Pour étiquettage en série on ne garde en sélection qu'un seul article
        SAUF si c'est un article de code explicite qui commence W X Y Z
        Dans ce cas on garde la liste : ça va être par exemple les différents morceaux de boucherie à la livraison
        */
        this.selArticles = [article]
      }
      if (this.poidsBalance === 0) {
        // Pas de poids sur la balance : refus SAUF si c'est un article en nombre de pièces et qu'on est en saisie en série
        if (article.unite !== 'kg' || (!article.unite === 'kg' && !this.enserie)) {
          this.sanspoids = true
          return
        }
      }
      if (article.unite === 'kg') {
        // Si c'est un article au poids : on peut imprimer l'étiquette
        this.imprimer(article, this.poidsBalance, this.poidsContenant)
      } else {
        // C'est un aricle en nombre de pièces, il faut demande combien il y en a, SAUF si c'est une saisie en série (c'est 1)
        if (!this.enserie) {
          this.articleCourant = article
          this.nbpieces = 0
          this.saisiepieces = true
        } else {
          this.imprimer(article, 1)
        }
      }
    },

    /*
    Retour de la saisie du nombre d'unités sur le plateau
    */
    saisieunitesok(nb) {
      this.saisiepieces = false
      if (this.t2) {
        clearTimeout(this.t2)
        this.t2 = null
      }
      if (nb > 0) {
        this.imprimer(this.articleCourant, nb)
      } else {
        this.raz()
      }
    },

    /*
    Impression de l'étiquette
    */
    async imprimer(article, poidsB, poidsC) {
      this.raz()
      try {
        // let e =
        const err = await etiquette(this.ecouteBalance, article, poidsB, poidsC)
        if (err) {
          if (err === '99999') {
            this.texteAlerte = 'Le poids a été mal récupéré. Repeser le produit, l\'enlever du plateau et recommencer.'
          } else {
            this.texteAlerte = 'L\'impression de l\'étiquette a échoué (problème \'imprimante)\nAppeler le coordonnateur.\n' + err
          }
          this.alerte = true
          console.log('ERR : ' + err)
        }
        // console.log(e)
      } catch (err) {
        if (err === '99999') {
          this.texteAlerte = 'Le poids a été mal récupéré. Repeser le produit, l\'enlever du plateau et recommencer'
        } else {
          this.texteAlerte = 'L\'impression de l\'étiquette a échoué (problème \'imprimante)\nAppeler le coordonnateur.\n' + err
        }
        this.alerte = true
        console.log(err.message)
      }
    },

    async recharger() {
      await this.articlesAPeser (true)
    },

    async articlesAPeser (recharg) {
      this.setMask()
      try {
        const args = { dh: this.articles.dh, sha: this.articles.sha, $username: config.username, $password: config.password }
        if (recharg) args.recharg = true
        const url = config.odooproxy + 'm1/articlesAPeser'
        const r = await axios.post(url, args, { responseType: 'json' })
        const x = r.data
        if (x.sha === cache.sha) {
          cache.dh = x.dh
        } else {
          cache.sha = x.sha
          cache.dh = x.dh
          cache.liste = x.liste
          setCache()
          const t = decoreArticles(x.liste, true, lgn)
          this.nberreurs = t[0]
          this.articles = t[1]
        }
        this.statusproxy = ''
      } catch (e) {
        this.statusproxy = e.message
      }
      this.unsetMask()
   }

  }
}
</script>

<style lang="sass">
@import './css/app.sass'
$largeWidth: 16rem
$standardWidth: 10rem

.souligne
  text-decoration: underline

.menuText
  font-size: $largeFontSize

.menuButton
  font-size: 2rem !important

.negative
  color: $negative

.dialogText
  font-size: $largeFontSize !important

$av-poidsfs: 2.8rem
$av-poidsh: 1.1 * $av-poidsfs

.av-poids
  font-size: $av-poidsfs
  text-align: center
  color: white
  font-weight: bold
  line-height: $av-poidsh
  height: $av-poidsh
  width: 13rem
  overflow: hidden

.av-poids2
  font-size: $av-poidsfs
  text-align: center
  color: black
  font-weight: bold
  line-height: $av-poidsh
  height: $av-poidsh
  width: 13rem
  overflow: hidden

$av-labelfs: 3rem
$av-labelh: 1.1 * $av-labelfs

.av-label
  font-size: $av-labelfs
  text-align: center
  color: $vertleger
  line-height: $av-labelh
  height: $av-labelh
  overflow: hidden

.av-label2
  font-size: $av-labelfs
  text-align: center
  color: black
  line-height: $av-labelh
  height: $av-labelh
  overflow: hidden

.av-gbtn
  background-color: $vertprofond
  color: white
  padding: 0.5rem
  margin: 0.5rem
  border-radius: 0.5rem
  border: 0.2rem solid $vertprofond
  cursor: pointer

.av-gbtn2
  color: black
  padding: 0.5rem
  margin: 0.5rem
  border-radius: 0.5rem
  border: 0.2rem solid transparent

.av-box1
  width: 6rem
  height: 2.5rem

.av-box2
  position: relative
  z-index: 2
  height: 2.5rem

.av-lettres
  margin: 0.2rem

$av-lettrefs: 3.5rem

.av-lettre
  font-size: $av-lettrefs
  border-radius: 1rem
  background-color: $vertprofond
  width: 1 * $av-lettrefs
  height: 1.2 * $av-lettrefs
  text-align: center
  color: white
  font-style: normal
  cursor: pointer

.av-lettre2
  position: relative
  top: -0.2 * $av-lettrefs

.av-codeCourt
  font-size: $av-lettrefs
  background-color: $grey-4
  width: 1.8 * $av-lettrefs !important
  height: 1.2 * $av-lettrefs
  text-align: left
  color: black
  font-style: normal

.av-codeCourt1
  height: 9.5rem
  width: 8rem !important
  padding: 0.5rem

.av-container
  padding: 0.5rem
  color: $grey-1
  text-align: center

.av-msg
  margin: 2rem
  font-size: 2.5rem
  font-style: italic
  border-radius: 1rem
  background-color: $grey-8
  padding: 1rem

</style>

<template>
    <div class="pave column items-center">
        <!-- Par simplification visuelle le poids s'affiche en grammes pour ne pas inciter l'utilisateur à chercher une virgule -->
        <div class="col poids">{{ '' + poids + (!unites ? 'g' : (poids > 1 ? ' pièces' : ' pièce'))}}</div>
        <div class="col row items-center">
            <div class="chiffre shadow-5" @click="clic(1)">1</div>
            <div class="chiffre shadow-5" @click="clic(2)">2</div>
            <div class="chiffre shadow-5" @click="clic(3)">3</div>
        </div>
        <div class="col row items-center">
            <div class="chiffre shadow-5" @click="clic(4)">4</div>
            <div class="chiffre shadow-5" @click="clic(5)">5</div>
            <div class="chiffre shadow-5" @click="clic(6)">6</div>
        </div>
        <div class="col row items-center">
            <div class="chiffre shadow-5" @click="clic(7)">7</div>
            <div class="chiffre shadow-5" @click="clic(8)">8</div>
            <div class="chiffre shadow-5" @click="clic(9)">9</div>
        </div>
        <div class="col row items-center">
            <div class="chiffre eff" @click="clic('bs')">Eff.</div>
            <div class="chiffre shadow-5" @click="clic(0)">0</div>
            <div class="chiffre ok" @click="clic('ok')">OK</div>
        </div>
    </div>
</template>

<script>
/*
Le composant "pavé numérique" reçoit comme attribut d'entrée :
- une valeur initiale : c'est par exemple le cas pour la saisie d'un nombre de paquets où une valeur probable est passée comme valeur initiale,
- unites : si true, la valeur est un nombre d'unités, si false c'est un poids à saisir.
Les touches 0 à 9 permettent d'ajouter un chiffre au nombre actuellement saisi.
La touche "Eff" est un backspace.
La touche OK est la validation du nombre courant.
La sortie du composant se fait par OK qui émet l'événement 'saisie-ok' qui est écouté par le composat qui a inclu le pavé numérique.
*/
export default {
  name: 'PaveNumerique',
  props: ['valeur', 'unites'],
  data () {
    return {
        poids: this.valeur // en fait c'est un poids en g ou un nombre d'unités
    }
  },
  methods: {
      clic(n) {
        if (n === 'ok') { // Evénement de fin avec transmission du poids (ou nombre d'unités) comme data
            this.$emit('saisie-ok', this.poids)
            return
        }
        if (n === 'bs') {
            // L'effacement du dernier chiffre revient à une division entière par 10. Ne fait rien quand c'est déjà 0
            if (this.poids > 0) this.poids = Math.floor(this.poids / 10)
            return
        }
        /*
        On ne peut ajouter un chiffre que si le nombre déjà entré n'a pas atteint le maximum de chiffres admis :
        - pour les unités c'est 2 chiffres (au plus 99 unités). Il faut donc que le nombre actuel soit inférieur à 10.
        - pour les poids c'est 5 chiffres (99,999kg).
        */
        const max = this.unites ? 10 : 10000
        if (this.poids < max) {
            this.poids = (this.poids * 10) + n
        }
      }
  }
}
</script>

<style lang="sass">
@import '../css/app.sass'
$largeWidth: 16rem
$veryLargeFontSize: 3.5rem;

.pave
    padding: 0.2rem
    background-color: white

.poids
    margin: 1rem
    font-size: $veryLargeFontSize
    font-weight: bold
    border-radius: 0.5rem
    border-width: 0.2rem
    border-color: $grey-6
    border-style: solid
    background-color: white
    width: $largeWidth
    height: 1.5 * $veryLargeFontSize
    text-align: center

.chiffre
    font-size: $veryLargeFontSize
    border-radius: 1rem
    background-color: $vertprofond
    width: 1.5 * $veryLargeFontSize
    height: 1.5 * $veryLargeFontSize
    text-align: center
    color: white
    font-style: normal
    margin: 1rem
    cursor: pointer

.ok
    background-color: $rougeprofond

.eff
    background-color: $grey-3
    color: $rougeprofond

</style>

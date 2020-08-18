const Board = require('./board');
const schema = require('@colyseus/schema');
const Schema = schema.Schema;
const MapSchema = schema.MapSchema;
const PokemonEntity = require('./pokemon-entity');
const PokemonFactory = require('../models/pokemon-factory');
const CLIMATE = require('../models/enum').CLIMATE;
const EFFECTS = require('../models/enum').EFFECTS;
const TYPE = require('../models/enum').TYPE;

class Simulation extends Schema {
  constructor(blueTeam, redTeam, blueEffects, redEffects) {
    super();
    this.board = new Board(9, 6);
    this.redTeam = new MapSchema();
    this.blueTeam = new MapSchema();
    this.blueEffects = [];
    this.redEffects = [];
    if(blueEffects){
      this.blueEffects = blueEffects;
    }
    if(redEffects){
      this.redEffects = redEffects;
    }
    this.climate = this.getClimate();
    this.finished = false;
    for (const id in blueTeam) {
      const pokemon = blueTeam[id];
      // console.log("x",pokemon.positionX, "y", pokemon.positionY); // 0 for blue, 1 for red
      if (pokemon.positionY != 0) {
        const pokemonEntity = new PokemonEntity(pokemon.name, pokemon.index, pokemon.positionX, pokemon.positionY - 1, pokemon.hp, pokemon.atk,pokemon.def, pokemon.range, 0, pokemon.attackSprite, pokemon.rarity);
        this.applyEffects(pokemonEntity, pokemon.types, blueEffects, redEffects, blueTeam, redTeam);
        this.blueTeam[pokemonEntity.id] = pokemonEntity;
        // console.log("entity x",pokemonEntity.positionX, "y", pokemonEntity.positionY);
        this.board.setValue(pokemonEntity.positionX, pokemonEntity.positionY, pokemonEntity);
      }
    }
    for (const id in redTeam) {
      const pokemon = redTeam[id];
      // console.log("x",pokemon.positionX, "y", pokemon.positionY);
      if (pokemon.positionY != 0) {
        const pokemonEntity = new PokemonEntity(pokemon.name, pokemon.index, pokemon.positionX, 5 - (pokemon.positionY - 1), pokemon.hp, pokemon.atk, pokemon.def, pokemon.range, 1, pokemon.attackSprite, pokemon.rarity);
        this.applyEffects(pokemonEntity, pokemon.types, redEffects, blueEffects, redTeam, blueTeam);
        this.redTeam[pokemonEntity.id] = pokemonEntity;
        // console.log("entity x",pokemonEntity.positionX, "y", pokemonEntity.positionY);
        this.board.setValue(pokemonEntity.positionX, pokemonEntity.positionY, pokemonEntity);
      }
    }
    if(blueEffects.includes(EFFECTS.PRIMORDIAL_SEA)){
      const kyogre = PokemonFactory.createPokemonFromName('kyogre');
      const coord = this.getFirstAvailablePlaceOnBoard(true);
      const pokemonEntity = new PokemonEntity(kyogre.name, kyogre.index, coord[0], coord[1], kyogre.hp,kyogre.atk,kyogre.def,kyogre.range,0,kyogre.attackSprite,kyogre.rarity);
      this.applyEffects(pokemonEntity, kyogre.types, blueEffects, redEffects, blueTeam, redTeam);
      this.blueTeam[pokemonEntity.id] = pokemonEntity;
      this.board.setValue(coord[0], coord[1], pokemonEntity);
    }
    if(redEffects.includes(EFFECTS.PRIMORDIAL_SEA)){
      const kyogre = PokemonFactory.createPokemonFromName('kyogre');
      const coord = this.getFirstAvailablePlaceOnBoard(false);
      const pokemonEntity = new PokemonEntity(kyogre.name, kyogre.index, coord[0], coord[1], kyogre.hp,kyogre.atk,kyogre.def,kyogre.range,1,kyogre.attackSprite,kyogre.rarity);
      this.applyEffects(pokemonEntity, kyogre.types, blueEffects, redEffects, redTeam, blueTeam);
      this.redTeam[pokemonEntity.id] = pokemonEntity;
      this.board.setValue(coord[0], coord[1], pokemonEntity);
    }
  }

  getFirstAvailablePlaceOnBoard(ascending){
    let row = 0;
    let column = 0;
    if(ascending){
      outerloop:
      for (let x = 0; x < this.board.rows; x++) {
        for (let y = 0; y < this.board.columns; y++) {
          if(this.board.getValue(x,y) === undefined){
            row = x;
            column = y;
            break outerloop;
          }
        }
      }
    }
    else{
      outerloop:
      for (let x = 0; x < this.board.rows; x++) {
        for (var y = this.board.columns - 1; y >= 0; y--){
          if(this.board.getValue(x,y) === undefined){
            row = x;
            column = y;
            break outerloop;
          }
        }
      }
    }
    return [row,column];
  }

  applyEffects(pokemon, types, allyEffects, ennemyEffects, allyTeam, ennemyTeam){

    allyEffects.forEach(effect => {
      switch (effect) {
        case EFFECTS.BLAZE:
          if(types.includes(TYPE.FIRE)){
            pokemon.effects.push(EFFECTS.BLAZE);
          }
          break;
        
        case EFFECTS.DROUGHT:
          if(this.climate == CLIMATE.SUN && types.includes(TYPE.FIRE)){
            pokemon.effects.push(EFFECTS.DROUGHT);
            pokemon.atk += Math.round(pokemon.baseAtk * 0.33);
          }
          break;
        
        case EFFECTS.INGRAIN:
          if(types.includes(TYPE.GRASS)){
            pokemon.effects.push(EFFECTS.INGRAIN);
          }
          break;
        
        case EFFECTS.GROWTH:
          if(types.includes(TYPE.GRASS)){
            pokemon.effects.push(EFFECTS.GROWTH);
            pokemon.def += Math.round(pokemon.baseDef * 0.25);
          }
          break;

        case EFFECTS.DRIZZLE:
          if(this.climate == CLIMATE.RAIN && types.includes(TYPE.WATER)){
            pokemon.effects.push(EFFECTS.DRIZZLE);
            pokemon.atk += Math.round(pokemon.baseAtk * 0.33);
          }
          break;

        case EFFECTS.RAIN_DANCE:
          if(this.climate == CLIMATE.RAIN && types.includes(TYPE.WATER)){
            pokemon.effects.push(EFFECTS.RAIN_DANCE);
            pokemon.atk += Math.round(pokemon.baseAtk * 0.33);
          }
          break;

        case EFFECTS.STAMINA:
          if(types.includes(TYPE.NORMAL)){
            pokemon.effects.push(EFFECTS.STAMINA);
            pokemon.life += 20;
          }
          break;
        
        case EFFECTS.STRENGTH:
          if(types.includes(TYPE.NORMAL)){
            pokemon.atk += Math.round(pokemon.baseAtk * 0.1);
            pokemon.def += Math.round(pokemon.baseDef * 0.1);
            pokemon.effects.push(EFFECTS.STRENGTH);
          }
          break;
        
        case EFFECTS.PURE_POWER:
          pokemon.atk += Math.round(pokemon.baseAtk);
          pokemon.effects.push(EFFECTS.PURE_POWER);
          break;
        
        case EFFECTS.AGILITY:
          if(types.includes(TYPE.ELECTRIC)){
            let speedFactor = 1;
            for (const id in allyTeam){
              if(allyTeam[id].types.includes(TYPE.ELECTRIC)){
                speedFactor -= 0.1;
              }
            }
            pokemon.atkSpeed = pokemon.atkSpeed * speedFactor;
            pokemon.effects.push(EFFECTS.AGILITY);
          }
          break;

        case EFFECTS.REVENGE:
          if(types.includes(TYPE.FIGHTING) && Object.keys(ennemyTeam).length > Object.keys(allyTeam).length){
            pokemon.atk += Math.round(pokemon.baseAtk * 0.2);
            pokemon.effects.push(EFFECTS.REVENGE);
          }
          break;
        
        case EFFECTS.PUNISHMENT:
          if(types.includes(TYPE.FIGHTING)){
            ennemyEffects.forEach(effect =>{
              pokemon.atk += Math.round(pokemon.baseAtk * 0.1);
            });
            pokemon.effects.push(EFFECTS.PUNISHMENT);
          }
          break;
        
        case EFFECTS.IRON_DEFENSE:
          if(types.includes(TYPE.MINERAL)){
            pokemon.def += Math.round(pokemon.baseDef * 0.5);
            pokemon.effects.push(EFFECTS.IRON_DEFENSE);
          }
          break;
        
        case EFFECTS.AUTOTOMIZE:
          if(types.includes(TYPE.MINERAL)){
            pokemon.atkSpeed += pokemon.atkSpeed * 0.5;
            pokemon.effects.push(EFFECTS.AUTOTOMIZE);
          }
          break;
        
        case EFFECTS.WORK_UP:
          if(types.includes(TYPE.FIELD)){
            pokemon.atk += Math.round(pokemon.baseAtk * Object.keys(ennemyTeam).length * 0.04);
            pokemon.effects.push(EFFECTS.WORK_UP);
          }
          break;

        case EFFECTS.RAGE:
          if(types.includes(TYPE.FIELD)){
            pokemon.effects.push(EFFECTS.RAGE);
          }
          break;
        
        case EFFECTS.ANGER_POINT:
          if(types.includes(TYPE.FIELD)){
            pokemon.effects.push(EFFECTS.ANGER_POINT);
          }
          break;
       
        case EFFECTS.BRUTAL_SWING:
          if(types.includes(TYPE.MONSTER)){
            pokemon.effects.push(EFFECTS.BRUTAL_SWING);
          }
          break;

        case EFFECTS.POWER_TRIP:
          if(types.includes(TYPE.MONSTER)){
            pokemon.effects.push(EFFECTS.POWER_TRIP);
          }
          break;
        
        case EFFECTS.MEDITATE:
          pokemon.atk += Math.round(pokemon.baseAtk * 0.15);
          pokemon.def += Math.round(pokemon.baseDef * 0.15);
          pokemon.effects.push(EFFECTS.MEDITATE);
          break;

        case EFFECTS.FOCUS_ENERGY:
          pokemon.effects.push(EFFECTS.FOCUS_ENERGY);
          break;

        case EFFECTS.CALM_MIND:
          pokemon.atk += Math.round(pokemon.baseAtk * 0.3);
          pokemon.def += Math.round(pokemon.baseDef * 0.3);
          pokemon.effects.push(EFFECTS.CALM_MIND);
          break;
        
        case EFFECTS.SWIFT_SWIM:
          if(types.includes(TYPE.WATER) && this.climate == CLIMATE.RAIN){
            pokemon.atkSpeed = pokemon.atkSpeed * 0.7;
            pokemon.effects.push(EFFECTS.SWIFT_SWIM);
          }
          break;
        
        case EFFECTS.HYDO_CANNON:
          if(types.includes(TYPE.WATER) && this.climate == CLIMATE.RAIN){
            pokemon.atk += Math.round(pokemon.baseAtk * 0.3);
            pokemon.effects.push(EFFECTS.HYDO_CANNON);
          }
          break;

        case EFFECTS.RAIN_DISH:
          if(types.includes(TYPE.FLORA) && this.climate == CLIMATE.RAIN){
            pokemon.effects.push(EFFECTS.RAIN_DISH);
          }
          break;
        
        case EFFECTS.BATTLE_ARMOR:
          if(types.includes(TYPE.MINERAL)){
            pokemon.def += Math.round(pokemon.baseDef * 0.25);
            pokemon.effects.push(EFFECTS.BATTLE_ARMOR);
          }
          break;
        
        case EFFECTS.PHANTOM_FORCE:
          if(types.includes(TYPE.AMORPH)){
            pokemon.effects.push(EFFECTS.PHANTOM_FORCE);
          }
      
        case EFFECTS.ATTRACT:
          if(types.includes(TYPE.FAIRY)){
            pokemon.effects.push(EFFECTS.ATTRACT);
          }
          break;

        case EFFECTS.BABY_DOLL_EYES:
          if(types.includes(TYPE.FAIRY)){
            pokemon.effects.push(EFFECTS.BABY_DOLL_EYES);
          }
          break;

        default:
          break;
      }
    });

    ennemyEffects.forEach(effect => {
      switch (effect) {

        case EFFECTS.SPORE:
          pokemon.atkSpeed = pokemon.atkSpeed * 0.5;
          pokemon.effects.push(EFFECTS.SPORE);
          break;

        case EFFECTS.PSYWAVE:
          pokemon.def -= Math.round(pokemon.baseDef * 0.3);
          pokemon.effects.push(EFFECTS.PSYWAVE);
          break;
        
        case EFFECTS.MAGIC_ROOM:
          pokemon.def -= Math.round(pokemon.baseDef * 0.3);
          pokemon.effects.push(EFFECTS.MAGIC_ROOM);
          break;
        
        case EFFECTS.MEAN_LOOK:
          pokemon.def -= Math.round(pokemon.baseDef * 0.2);
          pokemon.effects.push(EFFECTS.MEAN_LOOK);
          break;

        case EFFECTS.SCARY_FACE:
          pokemon.def -= Math.round(pokemon.baseDef * 0.2);
          pokemon.effects.push(EFFECTS.SCARY_FACE);
          break;
        
        case EFFECTS.SPIKES:
          pokemon.life -= Math.round(pokemon.hp * 0.1);
          pokemon.effects.push(EFFECTS.SPIKES);
          break;

        case EFFECTS.STEALTH_ROCK:
          pokemon.life -= Math.round(pokemon.hp * 0.1);
          pokemon.effects.push(EFFECTS.STEALTH_ROCK);
          break;

        case EFFECTS.PURSUIT:
          if(types.includes(TYPE.MONSTER)){
            pokemon.effects.push(EFFECTS.PURSUIT);
          }
          break;
        
        case EFFECTS.POISON_GAS:
          if(Math.random() > 0.9){
            pokemon.effects.push(EFFECTS.POISON_GAS);
          }
          break;
        
        case EFFECTS.TOXIC:
          pokemon.effects.push(EFFECTS.TOXIC);
          break;

        case EFFECTS.INTIMIDATE:
          pokemon.atk -= Math.round(pokemon.baseAtk * 0.3);
          pokemon.effects.push(EFFECTS.INTIMIDATE);
          break;

        case EFFECTS.DRACO_METEOR:
          pokemon.life -= Math.round(pokemon.hp * 0.1);
          pokemon.effects.push(EFFECTS.DRACO_METEOR);

        case EFFECTS.STICKY_WEB:
          pokemon.atkSpeed = pokemon.atkSpeed *0.9;
          pokemon.effects.push(EFFECTS.STICKY_WEB);
          break;

        case EFFECTS.RAZOR_WIND:
          pokemon.life -= Math.round(pokemon.hp * 0.1);
          pokemon.effects.push(EFFECTS.RAZOR_WIND);
          break;

        case EFFECTS.HURRICANE:
          pokemon.life -= Math.round(pokemon.hp * 0.1);
          pokemon.effects.push(EFFECTS.RAZOR_WIND);
          break;
        
        case EFFECTS.FLOWER_SHIELD:
          pokemon.def -= Math.round(pokemon.baseDef * 0.3);
          pokemon.effects.push(EFFECTS.FLOWER_SHIELD);
          break;

        default:
          break;
      }
    });
  }

  getClimate() {
    let climate = CLIMATE.NEUTRAL;
    if (this.blueEffects.includes(EFFECTS.DRIZZLE) || this.redEffects.includes(EFFECTS.DRIZZLE)) {
      climate = CLIMATE.RAIN;
    }
    if (this.blueEffects.includes(EFFECTS.DROUGHT) || this.redEffects.includes(EFFECTS.DROUGHT)) {
      climate = CLIMATE.SUN;
    }
    if (this.blueEffects.includes(EFFECTS.SANDSTORM) || this.redEffects.includes(EFFECTS.SANDSTORM)) {
      climate = CLIMATE.SANDSTORM;
    }
    if (this.blueEffects.includes(EFFECTS.PRIMORDIAL_SEA) || this.redEffects.includes(EFFECTS.PRIMORDIAL_SEA)) {
      climate = CLIMATE.RAIN;
    }
    return climate;
  }

  update(dt) {
    if (Object.keys(this.blueTeam).length == 0 || Object.keys(this.redTeam).length == 0) {
      this.finished = true;
    }

    for (const id in this.blueTeam) {
      if (this.blueTeam[id].life <= 0) {
        delete this.blueTeam[id];
      } else {
        this.blueTeam[id].update(dt, this.board, this.climate);
      }
    }
    for (const id in this.redTeam) {
      if (this.redTeam[id].life <= 0) {
        delete this.redTeam[id];
      } else {
        this.redTeam[id].update(dt, this.board, this.climate);
      }
    }
  }

  stop() {
    for (const id in this.blueTeam) {
      delete this.blueTeam[id];
    }
    for (const id in this.redTeam) {
      delete this.redTeam[id];
    }
    this.climate = CLIMATE.NEUTRAL;
  }
}

schema.defineTypes(Simulation, {
  blueTeam: {map: PokemonEntity},
  redTeam: {map: PokemonEntity},
  climate:"string"
});

module.exports = Simulation;

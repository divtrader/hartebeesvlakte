import type { IconName } from '../components/icons';

export type Group = 'game' | 'birds' | 'predators' | 'small' | 'plants';

export interface Species {
  id: string;
  group: Group;
  en: string;
  af: string;
  sci?: string;
  /** Months (1 to 12) in which the plant usually flowers in the Klein Karoo. */
  flowers?: number[];
  /** Flower colour, used for the dots in lists and calendars. */
  colour?: string;
  unknown?: boolean;
  /** Scientific name BirdNET uses, where it differs from `sci`. */
  birdnet?: string;
}

export interface GroupInfo {
  label: string;
  colour: string;
  tint: string;
  icon: IconName;
}

export const GROUPS: Record<Group, GroupInfo> = {
  game: { label: 'Game', colour: '#A94A24', tint: '#F3E1D6', icon: 'paw' },
  birds: { label: 'Birds', colour: '#2D6A88', tint: '#DCEAF0', icon: 'bird' },
  predators: { label: 'Predators', colour: '#3F382D', tint: '#E4DED3', icon: 'claw' },
  small: { label: 'Small life', colour: '#5A6B2E', tint: '#E6EAD2', icon: 'tortoise' },
  plants: { label: 'Plants', colour: '#8E2A5E', tint: '#F1DCE7', icon: 'flower' },
};

export const ANIMAL_GROUPS: Group[] = ['game', 'birds', 'predators', 'small'];

// A starter list for this part of the Klein Karoo. Add or remove species as the farm's own records grow.
export const SPECIES: Species[] = [
  // Game
  { id: 'kudu', group: 'game', en: 'Kudu', af: 'Koedoe', sci: 'Tragelaphus strepsiceros' },
  { id: 'red-hartebeest', group: 'game', en: 'Red hartebeest', af: 'Rooihartbees', sci: 'Alcelaphus buselaphus caama' },
  { id: 'klipspringer', group: 'game', en: 'Klipspringer', af: 'Klipspringer', sci: 'Oreotragus oreotragus' },
  { id: 'grey-rhebok', group: 'game', en: 'Grey rhebok', af: 'Vaalribbok', sci: 'Pelea capreolus' },
  { id: 'mountain-reedbuck', group: 'game', en: 'Mountain reedbuck', af: 'Rooiribbok', sci: 'Redunca fulvorufula' },
  { id: 'common-duiker', group: 'game', en: 'Common duiker', af: 'Duiker', sci: 'Sylvicapra grimmia' },
  { id: 'steenbok', group: 'game', en: 'Steenbok', af: 'Steenbok', sci: 'Raphicerus campestris' },
  { id: 'cape-grysbok', group: 'game', en: 'Cape grysbok', af: 'Kaapse grysbok', sci: 'Raphicerus melanotis' },
  { id: 'springbok', group: 'game', en: 'Springbok', af: 'Springbok', sci: 'Antidorcas marsupialis' },
  { id: 'gemsbok', group: 'game', en: 'Gemsbok', af: 'Gemsbok', sci: 'Oryx gazella' },
  { id: 'eland', group: 'game', en: 'Eland', af: 'Eland', sci: 'Taurotragus oryx' },
  { id: 'cape-mountain-zebra', group: 'game', en: 'Cape mountain zebra', af: 'Kaapse bergsebra', sci: 'Equus zebra zebra' },
  { id: 'bushbuck', group: 'game', en: 'Bushbuck', af: 'Bosbok', sci: 'Tragelaphus sylvaticus' },
  { id: 'chacma-baboon', group: 'game', en: 'Chacma baboon', af: 'Bobbejaan', sci: 'Papio ursinus' },
  { id: 'vervet-monkey', group: 'game', en: 'Vervet monkey', af: 'Blouaap', sci: 'Chlorocebus pygerythrus' },
  { id: 'unknown-game', group: 'game', en: 'Unknown animal', af: 'Onbekend', unknown: true },

  // Birds
  { id: 'ostrich', group: 'birds', en: 'Ostrich', af: 'Volstruis', sci: 'Struthio camelus' },
  { id: 'karoo-korhaan', group: 'birds', en: 'Karoo korhaan', af: 'Vaalkorhaan', sci: 'Eupodotis vigorsii' },
  { id: 'ludwigs-bustard', group: 'birds', en: "Ludwig's bustard", af: 'Ludwigse pou', sci: 'Neotis ludwigii' },
  { id: 'verreaux-eagle', group: 'birds', en: "Verreaux's eagle", af: 'Witkruisarend', sci: 'Aquila verreauxii' },
  { id: 'jackal-buzzard', group: 'birds', en: 'Jackal buzzard', af: 'Rooiborsjakkalsvoël', sci: 'Buteo rufofuscus' },
  { id: 'pale-chanting-goshawk', group: 'birds', en: 'Pale chanting goshawk', af: 'Bleeksingvalk', sci: 'Melierax canorus' },
  { id: 'rock-kestrel', group: 'birds', en: 'Rock kestrel', af: 'Kransvalk', sci: 'Falco rupicolus' },
  { id: 'secretarybird', group: 'birds', en: 'Secretarybird', af: 'Sekretarisvoël', sci: 'Sagittarius serpentarius' },
  { id: 'blue-crane', group: 'birds', en: 'Blue crane', af: 'Bloukraanvoël', sci: 'Grus paradisea', birdnet: 'Anthropoides paradiseus' },
  { id: 'spotted-eagle-owl', group: 'birds', en: 'Spotted eagle-owl', af: 'Gevlekte ooruil', sci: 'Bubo africanus' },
  { id: 'european-bee-eater', group: 'birds', en: 'European bee-eater', af: 'Europese byvreter', sci: 'Merops apiaster' },
  { id: 'diederik-cuckoo', group: 'birds', en: 'Diederik cuckoo', af: 'Diederikkie', sci: 'Chrysococcyx caprius' },
  { id: 'barn-swallow', group: 'birds', en: 'Barn swallow', af: 'Europese swael', sci: 'Hirundo rustica' },
  { id: 'malachite-sunbird', group: 'birds', en: 'Malachite sunbird', af: 'Jangroentjie', sci: 'Nectarinia famosa' },
  { id: 'southern-double-collared-sunbird', group: 'birds', en: 'Southern double-collared sunbird', af: 'Klein-rooibandsuikerbekkie', sci: 'Cinnyris chalybeus' },
  { id: 'cape-bunting', group: 'birds', en: 'Cape bunting', af: 'Rooivlerkstreepkoppie', sci: 'Emberiza capensis' },
  { id: 'karoo-prinia', group: 'birds', en: 'Karoo prinia', af: 'Karoolangstertjie', sci: 'Prinia maculosa' },
  { id: 'bokmakierie', group: 'birds', en: 'Bokmakierie', af: 'Bokmakierie', sci: 'Telophorus zeylonus' },
  { id: 'southern-fiscal', group: 'birds', en: 'Southern fiscal', af: 'Fiskaal', sci: 'Lanius collaris' },
  { id: 'cape-robin-chat', group: 'birds', en: 'Cape robin-chat', af: 'Gewone janfrederik', sci: 'Cossypha caffra' },
  { id: 'karoo-scrub-robin', group: 'birds', en: 'Karoo scrub robin', af: 'Slangverklikker', sci: 'Cercotrichas coryphoeus' },
  { id: 'familiar-chat', group: 'birds', en: 'Familiar chat', af: 'Gewone spekvreter', sci: 'Oenanthe familiaris' },
  { id: 'mountain-wheatear', group: 'birds', en: 'Mountain wheatear', af: 'Bergwagter', sci: 'Myrmecocichla monticola' },
  { id: 'cape-weaver', group: 'birds', en: 'Cape weaver', af: 'Kaapse wewer', sci: 'Ploceus capensis' },
  { id: 'namaqua-dove', group: 'birds', en: 'Namaqua dove', af: 'Namakwaduifie', sci: 'Oena capensis' },
  { id: 'speckled-pigeon', group: 'birds', en: 'Speckled pigeon', af: 'Kransduif', sci: 'Columba guinea' },
  { id: 'cape-turtle-dove', group: 'birds', en: 'Cape turtle dove', af: 'Gewone tortelduif', sci: 'Streptopelia capicola' },
  { id: 'pied-crow', group: 'birds', en: 'Pied crow', af: 'Witborskraai', sci: 'Corvus albus' },
  { id: 'white-necked-raven', group: 'birds', en: 'White-necked raven', af: 'Withalskraai', sci: 'Corvus albicollis' },
  { id: 'egyptian-goose', group: 'birds', en: 'Egyptian goose', af: 'Kolgans', sci: 'Alopochen aegyptiaca' },
  { id: 'blacksmith-lapwing', group: 'birds', en: 'Blacksmith lapwing', af: 'Bontkiewiet', sci: 'Vanellus armatus' },
  { id: 'hadeda-ibis', group: 'birds', en: 'Hadeda ibis', af: 'Hadeda', sci: 'Bostrychia hagedash' },
  { id: 'unknown-bird', group: 'birds', en: 'Unknown bird', af: 'Onbekende voël', unknown: true },

  // Predators
  { id: 'leopard', group: 'predators', en: 'Leopard', af: 'Luiperd', sci: 'Panthera pardus' },
  { id: 'caracal', group: 'predators', en: 'Caracal', af: 'Rooikat', sci: 'Caracal caracal' },
  { id: 'african-wildcat', group: 'predators', en: 'African wildcat', af: 'Vaalboskat', sci: 'Felis lybica' },
  { id: 'black-backed-jackal', group: 'predators', en: 'Black-backed jackal', af: 'Rooijakkals', sci: 'Lupulella mesomelas' },
  { id: 'cape-fox', group: 'predators', en: 'Cape fox', af: 'Silwervos', sci: 'Vulpes chama' },
  { id: 'bat-eared-fox', group: 'small', en: 'Bat-eared fox', af: 'Bakoorjakkals', sci: 'Otocyon megalotis' },
  { id: 'aardwolf', group: 'small', en: 'Aardwolf', af: 'Aardwolf', sci: 'Proteles cristatus' },
  { id: 'honey-badger', group: 'predators', en: 'Honey badger', af: 'Ratel', sci: 'Mellivora capensis' },
  { id: 'unknown-predator', group: 'predators', en: 'Unknown predator', af: 'Onbekende roofdier', unknown: true },

  // Small life: small mammals and reptiles
  { id: 'rock-hyrax', group: 'small', en: 'Rock hyrax', af: 'Dassie', sci: 'Procavia capensis' },
  { id: 'cape-porcupine', group: 'small', en: 'Cape porcupine', af: 'Ystervark', sci: 'Hystrix africaeaustralis' },
  { id: 'scrub-hare', group: 'small', en: 'Scrub hare', af: 'Kolhaas', sci: 'Lepus saxatilis' },
  { id: 'aardvark', group: 'small', en: 'Aardvark', af: 'Erdvark', sci: 'Orycteropus afer' },
  { id: 'cape-grey-mongoose', group: 'small', en: 'Cape grey mongoose', af: 'Kaapse grysmuishond', sci: 'Herpestes pulverulentus' },
  { id: 'yellow-mongoose', group: 'small', en: 'Yellow mongoose', af: 'Witkwasmuishond', sci: 'Cynictis penicillata' },
  { id: 'meerkat', group: 'small', en: 'Meerkat', af: 'Stokstertmeerkat', sci: 'Suricata suricatta' },
  { id: 'angulate-tortoise', group: 'small', en: 'Angulate tortoise', af: 'Rooipensskilpad', sci: 'Chersina angulata' },
  { id: 'leopard-tortoise', group: 'small', en: 'Leopard tortoise', af: 'Bergskilpad', sci: 'Stigmochelys pardalis' },
  { id: 'tent-tortoise', group: 'small', en: 'Tent tortoise', af: 'Knoppiesdopskilpad', sci: 'Psammobates tentorius' },
  { id: 'puff-adder', group: 'small', en: 'Puff adder', af: 'Pofadder', sci: 'Bitis arietans' },
  { id: 'cape-cobra', group: 'small', en: 'Cape cobra', af: 'Geelslang', sci: 'Naja nivea' },
  { id: 'boomslang', group: 'small', en: 'Boomslang', af: 'Boomslang', sci: 'Dispholidus typus' },
  { id: 'southern-rock-agama', group: 'small', en: 'Southern rock agama', af: 'Koggelmander', sci: 'Agama atra' },
  { id: 'unknown-small', group: 'small', en: 'Unknown small animal', af: 'Onbekend', unknown: true },

  // Plants
  { id: 'karoo-gold', group: 'plants', en: 'Karoo gold', af: 'Geelberggranaat', sci: 'Rhigozum obovatum', flowers: [8, 9, 10], colour: '#E7B416' },
  { id: 'vygies', group: 'plants', en: 'Vygies', af: 'Vygies', sci: 'Drosanthemum species', flowers: [8, 9, 10, 11], colour: '#C4407F' },
  { id: 'botterblom', group: 'plants', en: 'Botterblom', af: 'Botterblom', sci: 'Gazania krebsiana', flowers: [7, 8, 9, 10], colour: '#E07A2E' },
  { id: 'kapokbos', group: 'plants', en: 'Kapokbos', af: 'Kapokbos', sci: 'Eriocephalus ericoides', flowers: [6, 7, 8], colour: '#F2EEE3' },
  { id: 'bitter-aloe', group: 'plants', en: 'Bitter aloe', af: 'Bitteraalwyn', sci: 'Aloe ferox', flowers: [5, 6, 7, 8], colour: '#E0582B' },
  { id: 'sweet-thorn', group: 'plants', en: 'Sweet thorn', af: 'Soetdoring', sci: 'Vachellia karroo', flowers: [11, 12, 1, 2], colour: '#E7B416' },
  { id: 'april-fool', group: 'plants', en: 'April fool', af: 'Bloedblom', sci: 'Haemanthus coccineus', flowers: [3, 4], colour: '#C0392B' },
  { id: 'spekboom', group: 'plants', en: 'Spekboom', af: 'Spekboom', sci: 'Portulacaria afra', colour: '#D98BB0' },
  { id: 'pigs-ear', group: 'plants', en: "Pig's ear", af: 'Plakkie', sci: 'Cotyledon orbiculata', colour: '#E0582B' },
  { id: 'renosterbos', group: 'plants', en: 'Renosterbos', af: 'Renosterbos', sci: 'Elytropappus rhinocerotis', colour: '#B9A36A' },
  { id: 'karoo-boer-bean', group: 'plants', en: 'Karoo boer-bean', af: 'Karooboerboon', sci: 'Schotia afra', colour: '#C0392B' },
  { id: 'guarri', group: 'plants', en: 'Guarri', af: 'Ghwarrie', sci: 'Euclea undulata', colour: '#C9C2A0' },
  { id: 'unknown-plant', group: 'plants', en: 'Unknown plant', af: 'Onbekende plant', unknown: true, colour: '#CFC5B3' },
];

const byId = new Map(SPECIES.map((s) => [s.id, s]));
const added: Species[] = [];

/** Adds species found by bird sound identification that are not on the starter list. */
export function registerSpecies(list: Species[]): void {
  for (const s of list) {
    if (byId.has(s.id)) continue;
    byId.set(s.id, s);
    added.push(s);
  }
}

/** The starter list plus species added from bird sounds. */
export function allSpecies(): Species[] {
  return added.length ? [...SPECIES, ...added] : SPECIES;
}

export function getSpecies(id: string | undefined): Species | undefined {
  return id ? byId.get(id) : undefined;
}

export function speciesInGroups(groups: Group[]): Species[] {
  return allSpecies().filter((s) => groups.includes(s.group));
}

/** The species a BirdNET result refers to: from the list when known, otherwise a new bird species. */
export function speciesForBirdnet(sci: string, en: string, af: string): Species {
  const known = allSpecies().find((s) => s.sci === sci || s.birdnet === sci);
  if (known) return known;
  const id = `bn-${fold(sci).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;
  return { id, group: 'birds', en, af, sci };
}

/** Plants that usually flower in the given month (1 to 12). */
export function usuallyFlowering(month: number): Species[] {
  return SPECIES.filter((s) => s.flowers?.includes(month));
}

/** Case and accent insensitive match on English, Afrikaans and scientific names. */
export function matchesSearch(s: Species, query: string): boolean {
  const q = fold(query.trim());
  if (!q) return true;
  return [s.en, s.af, s.sci ?? ''].some((name) => fold(name).includes(q));
}

function fold(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

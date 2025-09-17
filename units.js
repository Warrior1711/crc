// List of available units with customizable stats and image (PNG or null for shape)
const UNIT_CONFIG = [
    {
        name: "Knight",
        type: "melee", // melee, ranged, spell
        damage: 30,
        cooldown: 1.2,
        hp: 120,
        speed: 2,
        color: "#b5651d",
        image: null // Use shape
    },
    {
        name: "Archer",
        type: "ranged",
        damage: 18,
        cooldown: 1.0,
        hp: 60,
        speed: 2.4,
        color: "#4af",
        image: null // Use shape
    },
    {
        name: "Fireball",
        type: "spell",
        damage: 50,
        cooldown: 2.5,
        hp: 1,
        speed: 0,
        color: "#f40",
        image: null
    },
    {
        name: "Goblin",
        type: "melee",
        damage: 12,
        cooldown: 0.7,
        hp: 30,
        speed: 3,
        color: "#3d3",
        image: null
    },
    {
        name: "Giant",
        type: "melee",
        damage: 55,
        cooldown: 1.8,
        hp: 250,
        speed: 1.3,
        color: "#aaa",
        image: null
    },
    {
        name: "Mage",
        type: "ranged",
        damage: 35,
        cooldown: 1.4,
        hp: 60,
        speed: 2.2,
        color: "#c5a3ff",
        image: null
    },
    {
        name: "Dragon",
        type: "ranged",
        damage: 40,
        cooldown: 1.8,
        hp: 160,
        speed: 2.1,
        color: "#f33",
        image: null // For a custom PNG, provide the path: "dragon.png"
    }
    // Add more units here!
];

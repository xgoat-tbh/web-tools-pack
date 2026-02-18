export type Role = "Controller" | "Initiator" | "Duelist" | "Sentinel"

export interface Agent {
  name: string
  role: Role
}

export interface Composition {
  agents: string[]
  reasoning: string
  style: string
}

export interface MapData {
  name: string
  image?: string
  compositions: Composition[]
}

export const agents: Agent[] = [
  // Controllers
  { name: "Astra", role: "Controller" },
  { name: "Brimstone", role: "Controller" },
  { name: "Harbor", role: "Controller" },
  { name: "Omen", role: "Controller" },
  { name: "Viper", role: "Controller" },
  { name: "Clove", role: "Controller" },
  // Initiators
  { name: "Breach", role: "Initiator" },
  { name: "Fade", role: "Initiator" },
  { name: "Gekko", role: "Initiator" },
  { name: "KAY/O", role: "Initiator" },
  { name: "Skye", role: "Initiator" },
  { name: "Sova", role: "Initiator" },
  // Duelists
  { name: "Jett", role: "Duelist" },
  { name: "Neon", role: "Duelist" },
  { name: "Phoenix", role: "Duelist" },
  { name: "Raze", role: "Duelist" },
  { name: "Reyna", role: "Duelist" },
  { name: "Yoru", role: "Duelist" },
  { name: "Iso", role: "Duelist" },
  // Sentinels
  { name: "Chamber", role: "Sentinel" },
  { name: "Cypher", role: "Sentinel" },
  { name: "Deadlock", role: "Sentinel" },
  { name: "Killjoy", role: "Sentinel" },
  { name: "Sage", role: "Sentinel" },
  { name: "Vyse", role: "Sentinel" },
]

export const agentsByRole = (role: Role) => agents.filter((a) => a.role === role)
export const getAgent = (name: string) => agents.find((a) => a.name === name)

export const roleColors: Record<Role, string> = {
  Controller: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Initiator: "bg-green-500/20 text-green-400 border-green-500/30",
  Duelist: "bg-red-500/20 text-red-400 border-red-500/30",
  Sentinel: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
}

export const roleIcons: Record<Role, string> = {
  Controller: "🛡️",
  Initiator: "⚡",
  Duelist: "⚔️",
  Sentinel: "🔒",
}

export const maps: MapData[] = [
  {
    name: "Ascent",
    compositions: [
      {
        agents: ["Jett", "Sova", "Omen", "KAY/O", "Killjoy"],
        reasoning: "Classic Ascent comp. Sova provides unmatched info on both sites. KAY/O suppresses utility-heavy defenders. Killjoy locks down a site for retakes. Omen provides flexible smokes.",
        style: "Balanced",
      },
      {
        agents: ["Raze", "Fade", "Astra", "Breach", "Cypher"],
        reasoning: "Double initiator provides heavy info and clear potential. Raze excels in tight spaces. Astra's global smokes allow cross-map setups. Cypher holds flanks.",
        style: "Info-Heavy",
      },
    ],
  },
  {
    name: "Bind",
    compositions: [
      {
        agents: ["Raze", "Skye", "Brimstone", "Fade", "Cypher"],
        reasoning: "Raze dominates Bind's tight corridors with grenades and satchels. Double initiator (Skye + Fade) clears tight angles. Brimstone's molly and smokes control key areas.",
        style: "Aggressive",
      },
      {
        agents: ["Jett", "Breach", "Viper", "Skye", "Killjoy"],
        reasoning: "Viper walls divide sites effectively. Breach + Skye flash and stun for site takes. Killjoy provides post-plant lockdown. Jett creates opening picks.",
        style: "Execute-Based",
      },
    ],
  },
  {
    name: "Haven",
    compositions: [
      {
        agents: ["Jett", "Sova", "Omen", "Breach", "Killjoy"],
        reasoning: "Three sites require strong info and flexible rotations. Sova darts reveal pushes. Omen can TP for fast rotations. Breach clears garage and tight spaces.",
        style: "Balanced",
      },
      {
        agents: ["Neon", "Fade", "Astra", "KAY/O", "Cypher"],
        reasoning: "Neon's speed enables fast 3-site rotations. Double initiator clears sites efficiently. Astra provides global coverage across all three sites.",
        style: "Fast Rotate",
      },
    ],
  },
  {
    name: "Split",
    compositions: [
      {
        agents: ["Raze", "Skye", "Omen", "Breach", "Cypher"],
        reasoning: "Split's verticality suits Raze's satchels. Breach + Skye provide flashes for tight mid and ramp pushes. Omen smokes critical chokes.",
        style: "Aggressive",
      },
      {
        agents: ["Jett", "Fade", "Viper", "KAY/O", "Sage"],
        reasoning: "Viper wall cuts sites in half. Sage wall creates elevated positions. KAY/O knife disables utility-heavy spots. Fade prowlers clear tight corners.",
        style: "Utility-Heavy",
      },
    ],
  },
  {
    name: "Lotus",
    compositions: [
      {
        agents: ["Raze", "Fade", "Omen", "Breach", "Killjoy"],
        reasoning: "Three-site map needs strong info gathering. Raze clears tight corridors. Breach stuns through walls. Omen provides rotational flexibility with TP.",
        style: "Balanced",
      },
      {
        agents: ["Jett", "Skye", "Viper", "KAY/O", "Cypher"],
        reasoning: "Viper controls large site areas. Double initiator ensures safe site takes. Cypher watches rotating doors. Jett creates space on entry.",
        style: "Control",
      },
    ],
  },
  {
    name: "Sunset",
    compositions: [
      {
        agents: ["Jett", "Sova", "Omen", "Breach", "Cypher"],
        reasoning: "Mid-focused map benefits from Sova recon. Breach clears tight mid. Omen smokes key chokepoints. Cypher holds flanks during executes.",
        style: "Mid-Control",
      },
      {
        agents: ["Neon", "Fade", "Astra", "KAY/O", "Killjoy"],
        reasoning: "Neon's speed suits fast site executions. Astra pulls and stars control space. KAY/O suppresses defender utility. Killjoy provides post-plant anchor.",
        style: "Fast Execute",
      },
    ],
  },
  {
    name: "Breeze",
    compositions: [
      {
        agents: ["Jett", "Sova", "Viper", "KAY/O", "Cypher"],
        reasoning: "Large open map needs Viper walls to cut sightlines. Sova provides long-range recon. Jett OPs on long angles. KAY/O disrupts site anchors.",
        style: "Long-Range",
      },
      {
        agents: ["Neon", "Skye", "Viper", "Fade", "Chamber"],
        reasoning: "Neon slides into sites quickly on this large map. Double initiator ensures site is clear. Chamber holds long angles with Tour De Force.",
        style: "Hybrid",
      },
    ],
  },
  {
    name: "Icebox",
    compositions: [
      {
        agents: ["Jett", "Sova", "Viper", "Sage", "KAY/O"],
        reasoning: "Viper is essential for site control on Icebox. Sage walls create elevated positions. Sova recon reveals common hiding spots. Jett takes aggressive OPing positions.",
        style: "Classic",
      },
      {
        agents: ["Raze", "Fade", "Omen", "KAY/O", "Killjoy"],
        reasoning: "Raze grenades flush out tubular spaces. Double initiator clears vertical positions. Killjoy provides strong B site hold.",
        style: "Utility Clear",
      },
    ],
  },
  {
    name: "Abyss",
    compositions: [
      {
        agents: ["Jett", "Fade", "Omen", "Breach", "Cypher"],
        reasoning: "Unique map with fall hazards benefits from info tools. Fade prowlers check dangerous edges. Breach stuns through walls near dropoffs. Omen repositions with teleport.",
        style: "Safe Play",
      },
      {
        agents: ["Raze", "Sova", "Astra", "KAY/O", "Killjoy"],
        reasoning: "Raze satchels create mobility around danger zones. Sova recon provides safe info. Astra stars control space from safe positions. Killjoy anchors post-plant.",
        style: "Methodical",
      },
    ],
  },
]

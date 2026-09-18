/* ============================================================
 * data.js — Medical/scientific content for the visualization
 * ------------------------------------------------------------
 * All educational text lives here so the medical wording can be
 * reviewed and corrected without touching rendering code.
 *
 * Accuracy ground rules encoded in this content:
 *  - ALS damages BOTH upper and lower motor neurons; this page
 *    focuses ONLY on the lower motor unit.
 *  - There is no single proven universal molecular sequence;
 *    mechanisms vary between patients.
 *  - Muscle atrophy is shown as a consequence of losing nerve
 *    input (neurogenic atrophy), not of aging or lifestyle.
 *  - ALS is NOT primarily a demyelinating disease.
 *  - No single visible abnormality is sufficient to diagnose ALS.
 * ============================================================ */

const LMN_DATA = {

  /* ---- Clickable structures: normal role vs. ALS relevance ---- */
  labels: {
    "soma": {
      title: "Motor-neuron cell body (soma)",
      normal: "Houses the nucleus and most of the cell's protein-making machinery. It integrates thousands of incoming signals and decides whether the neuron fires an action potential. Lower motor-neuron cell bodies sit in the anterior (ventral) horn of the spinal cord.",
      als: "The cell body is a primary site of injury in ALS: misfolded-protein clumps, stressed mitochondria and altered RNA processing are frequently reported, and the cell body may eventually degenerate and die — a hallmark of the disease. The exact mix of mechanisms differs between patients."
    },
    "dendrites": {
      title: "Dendrites",
      normal: "Branched extensions that receive excitatory and inhibitory synaptic inputs — including commands relayed from upper motor neurons — and funnel them toward the cell body.",
      als: "Dendritic trees can shrink and lose synapses relatively early. Changes in excitatory input may contribute to over-excitation (excitotoxicity) of motor neurons, one of several proposed injury mechanisms."
    },
    "hillock": {
      title: "Axon hillock",
      normal: "The 'trigger zone' where the cell body meets the axon. It sums all incoming signals and, if the threshold is reached, initiates the action potential that travels down the axon.",
      als: "As the neuron becomes sick, firing becomes unreliable: a voluntary command may fail to propagate down the axon even while the muscle is still structurally capable of contracting."
    },
    "axon": {
      title: "Axon",
      normal: "A single long fiber — up to about a meter for leg muscles — that carries action potentials from the spinal cord to the muscle. It is also the physical highway for axonal transport.",
      als: "The axon degenerates, typically in a 'dying-back' pattern that starts at the far (distal) end near the muscle. Transport falters, distal branches thin and fragment, and signals stop reaching some muscle fibers."
    },
    "myelin": {
      title: "Myelin sheath",
      normal: "Insulating layers wrapped around the axon by Schwann cells. Myelin lets the action potential jump rapidly between nodes of Ranvier (saltatory conduction), greatly increasing signaling speed.",
      als: "ALS is NOT primarily a demyelinating disease. Myelin changes are mostly secondary to axonal degeneration, which is why this visualization deliberately keeps the myelin largely intact while the axon inside it fails."
    },
    "schwann": {
      title: "Schwann cell",
      normal: "The glial cell of peripheral nerves. Each Schwann cell myelinates one segment of one axon, supports the axon metabolically, and — at the neuromuscular junction — terminal Schwann cells cap and maintain the synapse.",
      als: "Schwann cells respond to denervation and help guide sprouting axons during reinnervation. Their normal supportive functions may themselves be altered in ALS, an active research area."
    },
    "mito": {
      title: "Mitochondria",
      normal: "Produce ATP, the cell's energy currency. Because terminals need constant energy, mitochondria are continuously shipped along the axon and worn-out ones are returned for recycling.",
      als: "Mitochondrial dysfunction — abnormal shape, impaired movement along the axon, reduced energy output and increased production of damaging reactive oxygen species — is frequently reported in ALS and contributes to energy failure and oxidative stress."
    },
    "transport": {
      title: "Axonal-transport system",
      normal: "Motor proteins haul cargo along microtubule tracks in BOTH directions: kinesin walks toward the terminal (anterograde: mitochondria, vesicles, proteins, RNA), dynein walks back toward the cell body (retrograde: recycled material, distress and survival signals).",
      als: "Axonal transport is disrupted in many ALS models and in patient tissue: cargoes stall, terminals are starved of supplies, and signals from the terminal may fail to reach the cell body. This is one of several interacting mechanisms, not a universal first step."
    },
    "terminal": {
      title: "Motor axon terminal",
      normal: "The branched ending of the axon that forms synapses on muscle fibers. On arrival of an action potential it releases acetylcholine from synaptic vesicles.",
      als: "Terminals withdraw from the muscle endplate early in the disease process — often before the cell body dies. This 'dying-back' withdrawal is the anatomical basis of denervation."
    },
    "nmj": {
      title: "Neuromuscular junction (NMJ)",
      normal: "The synapse between motor neuron and muscle fiber: the presynaptic terminal, the synaptic cleft, and a folded postsynaptic membrane densely packed with acetylcholine receptors.",
      als: "NMJ instability is an early event. Some endplates are abandoned (denervation); surviving axons can later re-occupy them (reinnervation). The balance between these two processes shapes how strength changes over time."
    },
    "ach": {
      title: "Acetylcholine (ACh)",
      normal: "The neurotransmitter of the NMJ. Released in vesicle packets, it binds receptors on the muscle fiber and triggers an end-plate potential, which leads to a muscle action potential and contraction.",
      als: "With fewer functioning terminals, less acetylcholine reaches denervated fibers. Denervated fibers respond by spreading their receptors and becoming hyper-excitable, which contributes to spontaneous activity (fibrillations, fasciculations)."
    },
    "fiber": {
      title: "Muscle fiber",
      normal: "A skeletal-muscle cell packed with contractile myofibrils. It contracts only when its motor neuron signals it, and continuous nerve input also provides trophic support that keeps the fiber full-sized.",
      als: "Early in ALS the fiber is often still structurally capable of contracting — it has lost its nerve signal, not its machinery. A chronically denervated fiber first weakens, then shrinks (neurogenic atrophy). This is a consequence of losing nerve input, distinct from ordinary age-related muscle loss."
    },
    "unit": {
      title: "Motor unit",
      normal: "One lower motor neuron plus ALL the muscle fibers it innervates — from tens to hundreds of fibers in real muscles (only a few are drawn here). Motor units are the basic quanta of force: the nervous system recruits more of them as more force is needed.",
      als: "ALS is a disease of the whole motor unit: neuron, axon, NMJ and fibers. Units are lost as neurons die; surviving units temporarily enlarge by reinnervation, then shrink again. Fewer recruitable units means weaker, less coordinated movement."
    },
    "denervation": {
      title: "Denervation (a process, not a structure)",
      normal: "Not part of healthy physiology — this term describes loss of a muscle fiber's nerve supply, which in ALS usually begins with terminal withdrawal at the NMJ.",
      als: "Denervation is early and ongoing in ALS. Denervated fibers show spontaneous electrical activity (fibrillations on EMG), and when a whole sick motor unit fires spontaneously it produces a visible twitch (fasciculation). Fibers that are not reinnervated progressively atrophy."
    },
    "reinnervation": {
      title: "Reinnervation (compensation)",
      normal: "Also occurs after ordinary nerve injuries: surviving motor axons sprout collateral branches that grow to abandoned endplates and re-activate them.",
      als: "In ALS, collateral sprouting from surviving motor neurons temporarily compensates for neuronal loss — surviving motor units enlarge and strength can be preserved for a time. As the disease progresses, denervation outpaces reinnervation and strength declines."
    },
    "atrophy": {
      title: "Muscle atrophy (neurogenic)",
      normal: "Healthy fibers maintain their size through nerve input, activity and nutrition. Shrinkage from simple disuse or normal aging (sarcopenia) is slow and partial.",
      als: "In ALS, atrophy is mainly neurogenic — a direct consequence of losing motor-neuron input — and it can be severe. It is biologically distinct from ordinary aging of muscle, and it is an effect of the disease, not its cause."
    }
  },

  /* ---- Illustrative teaching states: 0 = healthy, 1–5 = ALS-related states ---- */
  stages: [
    {
      key: "healthy",
      short: "Healthy",
      title: "Normal lower motor neuron",
      body: "A voluntary command reaches the lower motor neuron in the anterior horn, an action potential travels the full length of the axon, acetylcholine is released at the neuromuscular junction, and all fibers of the motor unit contract together. Axonal transport runs continuously in both directions, supplying the terminal and reporting back to the cell body.",
      tags: []
    },
    {
      key: "s1",
      short: "1 · Cellular stress",
      title: "Illustrative state 1 — Cellular stress",
      body: "Several interacting problems are reported in ALS motor neurons: impaired protein handling (misfolded-protein clumps), mitochondrial dysfunction, altered RNA processing, oxidative stress, and disrupted axonal transport. Which of these dominates, and in what order, varies from person to person — there is no single proven universal sequence. In this teaching state the neuron still conducts signals, and strength is often preserved.",
      tags: ["Impaired protein handling", "Mitochondrial dysfunction", "Altered RNA processing", "Oxidative stress", "Disrupted axonal transport", "Mechanisms vary between patients"]
    },
    {
      key: "s2",
      short: "2 · NMJ instability",
      title: "Illustrative state 2 — Neuromuscular-junction instability",
      body: "The axon terminal begins to lose contact with some muscle fibers — a process called denervation. Signals no longer reach the abandoned fibers, so activation becomes weaker and less coordinated, even though the cell body is still alive and those fibers could still contract if reconnected.",
      tags: ["Terminal withdrawal", "Denervation begins", "Weaker, less coordinated activation"]
    },
    {
      key: "s3",
      short: "3 · Axonal degeneration",
      title: "Illustrative state 3 — Axonal degeneration",
      body: "Axonal transport slows and stalls, distal axonal branches thin and fragment, and action potentials fail to reach all muscle fibers. Degeneration typically proceeds in a 'dying-back' pattern, starting at the terminal. Note that the myelin sheath remains relatively preserved at first: ALS is not primarily a demyelinating disease.",
      tags: ["Stalled axonal transport", "Distal thinning & fragmentation", "Failing signal conduction", "Myelin relatively preserved"]
    },
    {
      key: "s4",
      short: "4 · Compensation",
      title: "Illustrative state 4 — Compensation (reinnervation)",
      body: "A surviving neighboring motor neuron sprouts collateral branches that reconnect with some abandoned muscle fibers — reinnervation. This can temporarily preserve strength and enlarges the surviving motor units, but it cannot keep pace with the disease indefinitely.",
      tags: ["Collateral sprouting", "Reinnervation", "Strength temporarily preserved"]
    },
    {
      key: "s5",
      short: "5 · Neuron loss",
      title: "Illustrative state 5 — Progressive motor-neuron loss",
      body: "Motor-neuron cell bodies degenerate and die, denervation spreads, motor units shrink, and chronically denervated fibers undergo neurogenic atrophy. Sick motor units may fire spontaneously, producing visible twitches (fasciculations). Weakness grows as fewer motor units remain to be recruited. Remember: ALS can also damage UPPER motor neurons in the brain and their descending pathways — this visualization focuses on the lower motor neuron only.",
      tags: ["Cell-body degeneration", "Shrinking motor units", "Fasciculations", "Weakness", "Neurogenic muscle atrophy"]
    }
  ],

  /* ---- Comparison panel content ---- */
  compare: {
    healthy: [
      "Stable neuromuscular connections",
      "Effective bidirectional axonal transport",
      "Reliable electrical signaling",
      "Normal motor-unit recruitment",
      "Preserved muscle mass"
    ],
    als: [
      "Motor-neuron degeneration",
      "Axonal and terminal degeneration",
      "Neuromuscular-junction denervation",
      "Reduced motor-unit recruitment",
      "Fasciculations, weakness, muscle atrophy"
    ]
  },

  /* ---- Fixed panels ---- */
  keyLesson: "In ALS, the muscle may initially be structurally capable of contracting, but it progressively loses effective communication with the lower motor neurons that activate and maintain it. The disease affects the entire motor unit: the neuron, its long axon, the neuromuscular junction, and the connected muscle fibers.",

  umnNote: "ALS can damage both UPPER motor neurons (brain → spinal cord) and LOWER motor neurons (spinal cord → muscle). This visualization focuses specifically on the lower motor neuron and its motor unit.",

  disclaimer: "This educational illustration is deliberately simplified, schematic, and not to scale. It is not medical advice, not a diagnostic tool, and not treatment guidance. Its teaching states are not clinical stages or a patient timeline. ALS varies widely between individuals, its causes are not fully understood, and no single visible abnormality is sufficient to diagnose ALS."
};

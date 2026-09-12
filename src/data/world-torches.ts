/**
 * Fire on the way.
 *
 * Where the paths between the islands carry fire: pale stone columns with
 * a bowl of flame on each, in pairs at the ends of every bridge, so the way
 * to each district is lit warm and read from across the water. Drawn and
 * collided against from this one list.
 */
export type Torch = { at: [number, number, number] };

/** The bridges, by their ends; each pair stands just inside the rail. */
export const TORCHES: Torch[][] = [
  /* Hub to Shipped. */
  [{ at: [-5.3, 0, -23.2] }, { at: [5.3, 0, -23.2] }, { at: [-5.3, 0, -28.8] }, { at: [5.3, 0, -28.8] }],
  /* Hub to Archive. */
  [{ at: [-5.3, 0, 35.2] }, { at: [5.3, 0, 35.2] }, { at: [-5.3, 0, 39.2] }, { at: [5.3, 0, 39.2] }],
  /* Hub to Labs. */
  [{ at: [30.6, 0, -5.3] }, { at: [30.6, 0, 5.3] }, { at: [33.6, 0, -5.3] }, { at: [33.6, 0, 5.3] }],
  /* Hub to Systems. */
  [{ at: [-30.6, 0, -5.3] }, { at: [-30.6, 0, 5.3] }, { at: [-33.6, 0, -5.3] }, { at: [-33.6, 0, 5.3] }],
  /* Shipped to the hall of screens. */
  [{ at: [29.9, 0, -62.6] }, { at: [34.1, 0, -62.6] }, { at: [29.9, 0, -69.4] }, { at: [34.1, 0, -69.4] }],
];

export const TORCH_OBSTACLES = TORCHES.flat().map((torch) => ({
  at: [torch.at[0], 1.2, torch.at[2]] as [number, number, number],
  size: [0.9, 2.4, 0.9] as [number, number, number],
}));

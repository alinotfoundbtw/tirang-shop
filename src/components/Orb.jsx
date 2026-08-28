/**
 * The assistant's orb.
 *
 * A sphere with colour drifting inside it. Built from blurred gradient blobs
 * behind a glass highlight rather than an image or a canvas: it re-skins with
 * the brand tokens, weighs nothing, and stays sharp at any size.
 *
 * Only `transform` and `opacity` animate, so the whole thing runs on the
 * compositor — a blurred layer that also animates its blur or its colours
 * would repaint every frame, and this sits on a page phones open on mobile
 * data. The blobs all have different, deliberately non-multiple durations so
 * the loop never visibly repeats.
 *
 * It is decoration. aria-hidden, and it holds no information that is not also
 * written on the page.
 */
export default function Orb({ size = 190, busy = false }) {
  return (
    <div
      className={`orb ${busy ? 'busy' : ''}`}
      style={{ '--orb': `${size}px` }}
      aria-hidden="true"
    >
      <span className="orb-glow" />
      <span className="orb-ball">
        <span className="orb-blob b1" />
        <span className="orb-blob b2" />
        <span className="orb-blob b3" />
        <span className="orb-grain" />
        <span className="orb-gloss" />
        <span className="orb-rim" />
      </span>
      <span className="orb-ring" />
    </div>
  );
}

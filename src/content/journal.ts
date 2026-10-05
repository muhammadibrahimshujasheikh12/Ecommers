/**
 * The AURAQ Journal. Article bodies are Markdown (## / ### headings,
 * paragraphs, - and 1. lists, | tables |, **bold**, [links](/path)) rendered
 * by the safe Markdown component. Keep each paragraph on a single line.
 * "Shop the story" products resolve by slug from the live catalogue; any
 * slug that is missing or inactive is simply skipped.
 */

export type JournalAuthorId = "sara" | "mahnoor" | "hina";

export const journalAuthors: Record<JournalAuthorId, { name: string; role: string; bio: string }> = {
  sara: {
    name: "Sara Imtiaz",
    role: "Journal Editor",
    bio: "Sara edits the AURAQ Journal and spends more time in the embroidery room than strictly necessary, asking the karigars questions they have answered a hundred times.",
  },
  mahnoor: {
    name: "Mahnoor Aziz",
    role: "Head Stylist",
    bio: "Mahnoor leads styling for our campaigns and boutiques. She has dressed more mehndis, nikkahs and Eid lunches than she can count, and always carries spare safety pins.",
  },
  hina: {
    name: "Hina Javed",
    role: "Head of Fabric & Quality",
    bio: "Hina sources, washes and wear-tests every fabric we use, from summer lawn to winter karandi, before a single metre reaches the cutting table.",
  },
};

export type JournalArticle = {
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  author: JournalAuthorId;
  publishedAt: string;
  updatedAt?: string;
  featured?: boolean;
  image: { src: string; alt: string };
  /** Opening paragraph, set larger than the body. */
  intro: string;
  body: string;
  pullQuote: { text: string; cite: string };
  figure: { src: string; alt: string; caption: string };
  bodyAfter: string;
  shop: { title: string; slugs: string[]; href: string; linkLabel: string };
};

export const journalArticles: JournalArticle[] = [
  {
    slug: "how-to-style-a-festive-dupatta",
    title: "How to Style a Festive Dupatta",
    category: "Style Notes",
    excerpt:
      "Five ways to wear organza and chiffon this festive season, from the classic one-shoulder drape to the cape, with the pins, pleats and proportions our stylists swear by.",
    author: "mahnoor",
    publishedAt: "2026-09-24",
    image: {
      src: "/images/pages/journal-festive-dupatta.jpg",
      alt: "Model in an ivory festive suit with a sheer organza dupatta over one shoulder, standing beneath a blush arch",
    },
    intro:
      "A dupatta is the most expressive piece in a Pakistani wardrobe. The same length of organza can read as demure, regal or entirely modern, depending on how you wear it. After a season of dressing brides’ sisters, Eid lunches and more mehndis than we can count, these are the drapes our styling team keeps coming back to, and exactly how to do them.",
    body: `## Start with the fabric

Before you choose a drape, consider what your dupatta is made of. **Organza** is crisp and holds a pleat, which makes it ideal for structured drapes that frame the shoulders. **Chiffon** is fluid and falls close to the body, so it suits looser, flowing styles. **Net** sits somewhere in between: light enough to float, firm enough to show off a heavily worked border.

A good rule of thumb: the stiffer the fabric, the fewer pins you need.

## 1. The one-shoulder drape

Our default for festive evenings, and the most forgiving. Pleat the dupatta lengthwise into soft folds about three fingers wide. Lay it over your left shoulder so the front falls to just above the knee, and let the back hang long. Secure it with a single safety pin hidden under the fold at the shoulder seam.

It keeps your hands free, shows off neckline embroidery and works with every silhouette, from straight shirts to kalidar pishwas and angrakhas.

## 2. The open drape

Lay the dupatta across the back of both shoulders and let the two ends fall evenly in front, like a stole. This is the drape for heavily embellished borders, such as gota, tilla or a scalloped cutwork edge, because the full length of the embroidery stays on display.

Pin each side discreetly at the shoulder so nothing slips while you greet a room full of relatives.`,
    pullQuote: {
      text: "The stiffer the fabric, the fewer pins you need. A good organza practically drapes itself.",
      cite: "Mahnoor Aziz, Head Stylist",
    },
    figure: {
      src: "/images/gallery/edit-2.jpg",
      alt: "Close crop of an ivory kurta worn with a gold-edged organza dupatta falling from one shoulder",
      caption: "The one-shoulder drape: pleated, pinned once at the seam and left to fall long at the back.",
    },
    bodyAfter: `## 3. The cape

The most contemporary of the five, and our favourite for organza. Fold the dupatta in half lengthwise, place the centre at the nape of your neck and bring both ends forward over the shoulders. Pin at each shoulder, then let the fabric fall behind you like a short cape. It works beautifully over sharara and gharara sets, where you want volume below and clean lines above.

## 4. The traditional head drape

For nikkahs, milads and visits to elders. Place one end over your left shoulder, take the length behind your back and bring it softly over your head from the right so it frames the face. A small flat hairpin tucked into a low bun will hold even slippery chiffon all evening.

## 5. The belted drape

For a mehndi or a dholki where you plan to dance. Drape over one shoulder, cross the length diagonally over your body and secure it at the opposite hip with a slim embroidered belt or a string of pearls. Nothing slips, nothing trails on the floor, and the silhouette stays sharp all night.

## Getting the proportions right

Length matters as much as the drape. Most of our festive dupattas are cut at two and a half metres, generous enough for every style above. If you are petite, let less length fall at the front and more behind you, so the line of the body stays long. If you are tall, the open drape and the cape both carry beautifully. And if your shirt is long, as with a kalidar or pishwas, keep the front of the dupatta above the hem so the two layers don’t blur together.

## The stylist’s kit

Keep these in your clutch for any festive evening:

- Two or three small gold-tone safety pins
- Flat hairpins for head drapes
- Fabric-safe double-sided tape for slippery chiffon
- A travel steamer, if you are dressing away from home

## Pairing notes

If your shirt is heavily embroidered, choose a dupatta with a worked border and a plain body, like our [Sitara organza dupatta](/product/sitara-organza-dupatta), so the two don’t compete. If your outfit is simple, let the dupatta do the talking: the embroidered border of the [Chandni dupatta](/product/chandni-organza-dupatta) can turn a plain kurta into an evening look.

## Caring for festive dupattas

Dry clean organza and net dupattas, and store them rolled rather than folded so the borders don’t crease along the same line each time. If a dupatta creases on the day, steam it from the reverse, keeping the steamer moving and a hand’s width away from any gota or tilla, which can tarnish with too much heat.`,
    shop: {
      title: "Dupattas & Festive Separates",
      slugs: ["sitara-organza-dupatta", "chandni-organza-dupatta", "sitara-kurta", "sitara-sharara"],
      href: "/collections/festive",
      linkLabel: "Shop The Festive Edit",
    },
  },
  {
    slug: "inside-the-atelier-120-hours-of-zardozi",
    title: "Inside the Atelier: 120 Hours of Zardozi",
    category: "Craft",
    excerpt:
      "We followed a single Signature piece, the emerald Zumurrud angrakha, from the tracing table to the final press, and met the karigars whose hands spend five weeks on it.",
    author: "sara",
    publishedAt: "2026-08-28",
    featured: true,
    image: {
      src: "/images/pages/journal-zardozi.jpg",
      alt: "Close crop of an emerald raw silk angrakha with a gold zardozi neckline and a gold-edged dupatta",
    },
    intro:
      "On the second floor of our Gulberg atelier, beneath a row of tall windows, eleven wooden frames stand side by side. Each holds a length of silk stretched taut as a drum. Around them sit the karigars, some of whom have done this work for four decades, and on any given morning you hear nothing but the soft pull of thread and old ghazals on the radio. This is where our zardozi happens. We followed one piece through every stage to understand where its 120 hours go.",
    body: `## Hour zero: the tracing

Every zardozi design begins as a drawing on butter paper. For Zumurrud, our design team drew a climbing vine of pomegranate flowers at full scale, adapted from a carved jaali screen in the old city. The drawing is then pricked along every line with a fine needle, laid over the silk and dusted with a chalk powder that passes through the holes, leaving a dotted outline.

The method is called **khaka**, and it hasn’t changed in centuries.

## Hours 1–90: the adda

The silk is stretched on the adda, a low wooden frame, and up to four karigars work on it at once, sitting cross-legged on either side. Zardozi uses several kinds of metal thread, and each has a different job:

- **Dabka**: fine coiled wire, cut into tiny lengths and threaded like beads, for raised, textured fills
- **Naqshi**: a twisted wire with a bright, glinting finish, used for outlines
- **Kora**: a matte coil that adds depth beside the shinier threads
- **Salma**: a smooth, spring-like coil for petals and curves
- **Sitara**: tiny metal sequins that catch the light at the heart of each flower

Each element is couched by hand with an aari, a fine hooked needle, or an ordinary sewing needle depending on the stitch. The neckline of Zumurrud alone carries more than six thousand individual pieces of dabka.

## A day at the adda

The working day starts at nine, after chai, and ends at five, with a long break at noon when the light is too harsh to judge gold against silk. Karigars rotate between pieces so that no one spends a whole day on the same motif, because tired hands make uneven stitches. On Zumurrud, four karigars took the neckline, two the sleeves and one the hem, each working from the same khaka so that the vine flows unbroken from one panel to the next.`,
    pullQuote: {
      text: "A machine can copy the pattern. It cannot copy the patience.",
      cite: "Ustad Bashir Ahmed, Master Karigar",
    },
    figure: {
      src: "/images/pages/atelier.jpg",
      alt: "Cut lengths of wine, ivory and emerald raw silk laid out on the atelier table",
      caption: "Raw silk in wine, ivory and emerald, cut and waiting for the adda.",
    },
    bodyAfter: `## Hours 90–110: the details

Once the main motifs are worked, the piece passes to our most senior karigar, Ustad Bashir Ahmed, who has been embroidering since he was twelve. He adds the final details, from the veins of each leaf to the single sitara at the centre of every flower, and checks every section under a daylight lamp. Anything that isn’t right is unpicked and worked again.

“People ask why it takes so long,” he says. “Because every piece of dabka is cut, threaded and placed by hand. You cannot rush metal. Pull too hard and it kinks; too soft and it lifts. Your hands learn the tension over years, not weeks.”

## Hours 110–120: finishing

The embroidered panels come off the frame, are steamed from the back and stitched into the finished garment by our tailoring team. The lining is hand-finished at the neckline so that no metal touches the skin. Finally, every Zumurrud is wrapped in unbleached muslin with a card signed by the karigars who made it.

## Why it matters

Zardozi has a five-hundred-year history in the subcontinent, and Lahore has long been one of its homes. But it is fragile craft. Young people are leaving it for steadier work, and machine embroidery has made imitations cheap.

That is why we pay our karigars fixed monthly salaries rather than piece rates, run a two-year apprenticeship for twelve trainees at a time, and credit the makers on every Signature card. When you wear a piece of zardozi, you are wearing roughly a working month of someone’s skill. We think that’s worth knowing.

## Caring for zardozi

Metal thread is durable, but it dislikes moisture and friction. Always dry clean zardozi, never iron directly over the embroidery, and store the piece flat or loosely rolled in muslin with acid-free tissue over the worked areas. Keep perfume and attar away from the metal and the gold will hold its warmth for decades. Many of our customers now pass their Signature pieces on to daughters and nieces, which is exactly what they were made for.

[Read more about our atelier and the techniques we use](/about).`,
    shop: {
      title: "Handworked in the Atelier",
      slugs: ["zumurrud", "yaqoot", "afsana", "arghavan"],
      href: "/collections/signature",
      linkLabel: "Shop The Signature Collection",
    },
  },
  {
    slug: "lawn-care-keep-your-prints-vivid",
    title: "Lawn Care: Keep Your Prints Vivid",
    category: "Care Guide",
    excerpt:
      "Cold water, shade and a little white vinegar: our fabric team’s guide to washing, drying, ironing and storing lawn so this summer’s prints look new next summer too.",
    author: "hina",
    publishedAt: "2026-07-03",
    image: {
      src: "/images/pages/journal-lawn-care.jpg",
      alt: "Folded lengths of aqua, blush and butter yellow printed lawn laid flat on a sage surface",
    },
    intro:
      "Lawn is the fabric of a Pakistani summer: fine, breathable cotton that softens with every wash. Treated well, a good lawn suit will see you through three or four seasons with its colours intact. Treated badly, it can fade by August. This is how our fabric team cares for theirs.",
    body: `## Before the first wash

Lawn prints are set with heat during finishing, but a little surplus dye can still release in the first wash, especially from deep shades like indigo, rani pink and emerald. Soak new pieces for twenty minutes in cold water with a tablespoon of white vinegar or a pinch of salt. It helps fix the colour and softens the finish.

Always wash each colour separately the first time. If the rinse water stays clear, you can wash it with similar shades from then on.

## Washing

- **Cold water only.** Never above 30°C. Heat is the single biggest cause of fading.
- **Turn it inside out.** Friction dulls the surface of a print, and washing inside out protects it.
- **Choose a mild, colour-safe detergent.** Avoid bleach and optical brighteners, which leave a chalky cast on printed cotton.
- **Hand wash, or use a gentle cycle.** Hand washing is best for embroidered shirts. Printed trousers and dupattas are fine on a delicate cycle in a mesh laundry bag.
- **Don’t soak embroidered pieces.** Resham and thread embroidery can bleed into the base fabric if left wet for too long.

## Drying

Summer sun here is fierce: wonderful for drying, terrible for colour. Dry lawn in the shade, inside out, and bring it in while it is still very slightly damp. Never wring it. Roll the piece in a clean towel and press to lift out the excess water.`,
    pullQuote: {
      text: "Treated well, a good lawn suit will see you through three or four summers with its colours intact.",
      cite: "Hina Javed, Head of Fabric & Quality",
    },
    figure: {
      src: "/images/categories/unstitched-3-piece.jpg",
      alt: "Folded unstitched lawn in peach, ivory and sage laid flat",
      caption: "Summer Lawn Vol. II: fine-count cotton lawn, printed in Pakistan and finished in our Lahore atelier.",
    },
    bodyAfter: `## Ironing

Iron on the reverse while slightly damp, on a medium cotton setting. For embroidered panels, place the embroidery face down on a folded towel and iron from the back. The towel cushions the stitches so they keep their relief instead of being pressed flat.

## Removing stains

Act quickly and work from the back of the fabric. Blot, never rub, and test any treatment on an inside seam first.

| Stain | What to do |
| --- | --- |
| Oil or haldi | Blot, cover with cornflour for 30 minutes, brush off, then wash the reverse with a drop of dish soap |
| Chai | Rinse under cold running water straight away, then dab with diluted white vinegar |
| Mehndi | Let it dry, lift off gently, then soak in cold water with a little lemon juice |
| Lipstick or kajal | Dab with a cotton pad and micellar water before washing |

## Storing between seasons

At the end of summer, wash and fully dry every piece before you put it away, because any trace of perspiration can yellow cotton over the winter. Fold with acid-free tissue between the layers, store in a cotton or muslin bag rather than plastic, which traps moisture, and tuck in a few dried neem leaves or a cedar block to keep moths away.

## Reviving tired lawn

If a favourite piece has started to look dull, the cause is usually detergent residue rather than fading. Soak it for half an hour in cold water with a cup of white vinegar, then rinse and dry in the shade. For whites and off-whites that have yellowed, a long soak in cold water with a spoonful of baking soda is far gentler than any whitener. And if a hem or neckline has frayed, bring it to any of our boutiques and we can usually repair it.

## Voile and printed dupattas

Lighter fabrics need lighter handling. Hand wash voile and lawn dupattas on their own, squeeze them gently rather than wringing, and dry them flat on a towel so their own weight doesn’t pull them out of shape.

## A note on unstitched

If you are having an unstitched suit tailored, ask your darzi to pre-wash the fabric before cutting. Lawn can shrink by two to three per cent on its first wash, and pre-washing means the fit you are measured for is the fit you keep. Our in-store [bespoke stitching service](/stores) does this as standard.`,
    shop: {
      title: "Summer Lawn, Made to Last",
      slugs: ["naubahar", "gul-e-nar", "tasneem", "marjaan"],
      href: "/collections/seasonal",
      linkLabel: "Shop Summer Lawn Vol. II",
    },
  },
  {
    slug: "choosing-the-right-fabric-for-every-season",
    title: "Choosing the Right Fabric for Every Season",
    category: "Fabric Guide",
    excerpt:
      "Lawn, cambric, khaddar, karandi, raw silk, chiffon: a plain-spoken guide to how each fabric feels, when to wear it and how it behaves through the year.",
    author: "hina",
    publishedAt: "2026-04-09",
    image: {
      src: "/images/pages/journal-fabric-guide.jpg",
      alt: "Folded swatches of sand cambric, powder blue lawn and plum raw silk laid flat",
    },
    intro:
      "Depending on who you ask, Pakistan has anywhere between four and six seasons, from Lahore’s blazing June to Islamabad’s misty January, with a monsoon and two very short springs in between. Choosing the right fabric for each one matters more than any print or cut. This is our fabric team’s guide.",
    body: `## Summer (April – June): breathe

**Lawn** is the queen of summer: a fine, plain-woven cotton, light and slightly crisp, that lets air through and dries quickly. Look for a high thread count, because the finer the yarn, the softer the lawn and the better it holds a print.

**Voile** is lawn’s lighter, more translucent cousin, beautiful for dupattas and layered shirts when worn with a slip. **Cotton net** and chikankari-style cotton suit summer evenings: the openwork keeps you cool while still looking dressed up.

## Monsoon (July – September): dry quickly

Humidity is the enemy. Choose fabrics that dry fast and don’t cling, so lawn and **linen-cotton blends** are best. Avoid silk and velvet, which spot with water, and keep trouser hems a little shorter to stay clear of wet streets.

## Autumn and spring: layer

October, November, February and March are when **cambric** comes into its own. Woven from slightly heavier cotton yarn, it is opaque, smooth and structured: warm in the morning, comfortable in the afternoon sun. **Cotton silk** adds a soft sheen for evenings, and **jacquard** brings woven texture without the weight of embroidery.`,
    pullQuote: {
      text: "If you remember one thing: cotton for heat, wool blends for cold, silk for occasions. Everything else is detail.",
      cite: "Hina Javed, Head of Fabric & Quality",
    },
    figure: {
      src: "/images/categories/unstitched.jpg",
      alt: "Folded unstitched fabrics in sand, sage and blush stacked on a table",
      caption: "From lawn to karandi, every AURAQ product page lists the full composition of each piece.",
    },
    bodyAfter: `## Winter (December – January): warmth with grace

**Khaddar** is a coarse, hand-loom-style cotton with a slubby, textured surface: warm, breathable and wonderfully relaxed. **Karandi** is a fine blend of cotton, silk and wool with a dry, slightly crinkled hand. It drapes like silk but keeps you warm, which makes it the winter fabric for formal occasions. **Marina** and **velvet** are for evenings, velvet especially at winter weddings, where nothing else looks as rich under the lights.

Pair winter shirts with a wool or pashmina **shawl** rather than a sheer dupatta.

## Occasion fabrics, all year round

| Fabric | Feels like | Best for | Care |
| --- | --- | --- | --- |
| Chiffon | Light, fluid and sheer | Daytime festive, Eid, mehndi | Dry clean or gentle hand wash |
| Organza | Crisp, airy and structured | Festive shirts and dupattas | Dry clean only |
| Raw silk | Textured, with a natural slub | Formal evenings and weddings | Dry clean only |
| Tissue | Metallic, crisp and luminous | Wedding functions | Dry clean only |
| Velvet | Dense, soft and rich | Winter weddings | Dry clean; steam, never iron |

## Lining and opacity

Fine lawn, voile, chiffon and net are all, to some degree, sheer. Our stitched pieces in these fabrics are lined wherever they need to be, usually with a soft cotton or silk slip, so you can wear them with confidence. If you are having unstitched fabric tailored, ask for a lining in the same tone as the shirt rather than plain white, which can show through darker prints.

## Matching fabric to silhouette

Fabric also decides which shapes work. Crisp fabrics like organza, cambric and raw silk hold structure, so they suit A-lines, angrakhas and kalidar panels. Fluid fabrics like chiffon and silk crepe suit straight cuts, flared shararas and anything that should move. Pairing the two, with a crisp shirt over fluid trousers or the reverse, is often what makes an outfit feel considered.

## How to read a fabric label

Every AURAQ product page lists the composition of each piece (shirt, dupatta and trouser), because a “lawn suit” can mean three different fabrics. A few terms worth knowing:

- **Thread count**: the number of threads per square inch; higher means finer
- **Self-woven or jacquard**: the pattern is woven into the cloth rather than printed on it
- **Dyed or printed**: dyed fabric is coloured all the way through; printed fabric is coloured on the surface

Still unsure? Our stylists can help you choose by fabric, season or occasion in any of our [boutiques](/stores), or over WhatsApp.`,
    shop: {
      title: "Dressed for the Season",
      slugs: ["darya", "laila", "benazir", "sanober"],
      href: "/category/ready-to-wear",
      linkLabel: "Shop Ready to Wear",
    },
  },
  {
    slug: "your-eid-wardrobe-edit",
    title: "Your Eid Wardrobe Edit",
    category: "The Edit",
    excerpt:
      "From chand raat to the third day of Eid: a stylist’s plan for five occasions, with what to wear, what to pack and how to rewear one hero piece three ways.",
    author: "mahnoor",
    publishedAt: "2026-02-12",
    image: {
      src: "/images/pages/journal-eid-edit.jpg",
      alt: "Two models in ivory and powder blue festive suits standing together beneath a carved arch",
    },
    intro:
      "Eid is never one outfit. It is five or six, across three days of visits, lunches, dinners and late-night chai. Planning ahead is the difference between enjoying the celebrations and standing in front of the wardrobe at midnight. This is how our styling team builds an Eid wardrobe, with plenty of room to rewear.",
    body: `## Chand raat: easy and bright

The night before Eid is for bazaars, bangles and mehndi, so think comfortable and colourful. A printed lawn or cotton silk shirt with straight trousers is ideal: light enough for crowded streets, bright enough for photographs. Our [Ghazal](/product/ghazal) shirt in rani pink with mirror work was made for exactly this night.

## Eid morning: soft and traditional

Eid prayers and the first round of family visits call for something graceful and unfussy. A pastel chiffon or lawn three-piece with delicate embroidery strikes the right note. Choose a dupatta you can easily draw over your head, and wear flats or kolhapuris, because you will be on your feet for hours.

## Eid lunch: the hero look

This is the main event, usually at the home of the family elder, and the one with the most photographs. Wear your most special piece: chiffon or organza with handwork, in a colour that suits you in daylight. Powder blue, mint and blush are perennial Eid favourites for a reason. They glow in natural light.`,
    pullQuote: {
      text: "Buy one hero piece and two supporting pieces. That’s three days of Eid sorted, and nobody will notice the rewear.",
      cite: "Mahnoor Aziz, Head Stylist",
    },
    figure: {
      src: "/images/campaigns/story-festive.jpg",
      alt: "Model in an ivory organza festive suit beneath an arch",
      caption: "Ivory organza for Eid lunch: soft enough for daylight, special enough for the family photograph.",
    },
    bodyAfter: `## Day two: dinner and dawat

Evenings call for richer textures. Swap daytime chiffon for raw silk, jacquard or cotton net, and let the jewellery come out. A sharara, gharara or lehnga set is perfect for a dinner dawat: it photographs beautifully and moves well when everyone ends up on the floor cushions after dessert.

## Day three: the relaxed rewear

By the third day the visits are winding down, and this is where rewearing shines. Take your hero kurta from Eid lunch and pair it with different bottoms and a new dupatta: straight trousers instead of a sharara, a contrasting organza dupatta instead of the matching chiffon. It reads as a completely new outfit.

## Jewellery and finishing touches

Let one element lead. With a heavily worked neckline, choose statement jhumkas and leave the neck bare; with a simpler shirt, a layered necklace or a matha patti can carry the look. Glass or gold bangles are an Eid tradition for good reason, and a small embroidered potli is far more practical than a clutch when your hands are full of mithai and Eidi envelopes.

## Coordinating with family

Family photographs are part of the day, so a little coordination goes a long way. Rather than matching exactly, agree on a shared palette, such as soft pastels for Eid morning or jewel tones for the dinner dawat, and let everyone wear their own silhouette within it. Our stylists are always happy to help pull together looks for the whole family.

## The Eid capsule

Starting from scratch? This is the list:

1. One hero three-piece with handwork, for Eid lunch
2. One evening set (sharara, gharara or lehnga) for dinners
3. One printed or lightly embroidered shirt for chand raat
4. One versatile embroidered kurta that works with trousers you already own
5. One statement dupatta that transforms everything else

## Before you go

- Order stitched pieces by the first week of Ramzan, because the last ten days are our busiest
- Have hems adjusted for the shoes you will actually wear
- Steam everything the night before and hang each outfit with its dupatta and jewellery
- Pack a small kit: safety pins, a stain pen and a spare pair of flat shoes

Our boutiques offer complimentary alterations and Eid styling appointments throughout Ramzan. [Find your nearest boutique](/stores).`,
    shop: {
      title: "The Eid Capsule",
      slugs: ["neelofar", "noor", "ghazal", "mehfil"],
      href: "/collections/festive",
      linkLabel: "Shop The Festive Edit",
    },
  },
];

/** Newest first. */
export const sortedArticles = [...journalArticles].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

export const getArticle = (slug: string) => journalArticles.find((a) => a.slug === slug) ?? null;

/** Estimated reading time at ~200 words per minute, rounded up. */
export function readingMinutes(article: JournalArticle): number {
  const text = [article.intro, article.body, article.pullQuote.text, article.bodyAfter].join(" ");
  const words = text.replace(/[#*|[\]()-]/g, " ").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

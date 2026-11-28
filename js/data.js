// THE VAULT — Supabase Configuration & Sample Auction Catalogue
// Note: The publishable key is safe in browser code because PostgreSQL Row Level Security protects tables.
window.VAULT_SUPABASE_CONFIG = Object.freeze({
  url: "https://mscwxwvpqlwffzlxmrxv.supabase.co",
  publishableKey: "sb_publishable_4mlmczRNadcRnkcWsfooZQ_tFd85lsK"
});

// Sample catalogue used for instant load and offline fallback when Supabase is unreachable.
window.VAULT_DATA = Object.freeze({
  lots: [
    { id: "watch", key: "lot-watch", number: "024", category: "Timepieces", period: "1960s–70s", title: "The Heritage Chronograph", subtitle: "1960s stainless-steel mechanical chronograph with manual winding and tachymeter dial.", price: 240000, bids: 7, estimate: "₹2,00,000 – ₹3,00,000", ends: 9340, image: "https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=1000&q=85", story: "A vintage 38mm stainless-steel chronograph powered by a hand-wound column-wheel movement. Includes clear sub-dials, original patina hands, and stitched leather strap." },
    { id: "art", key: "lot-art", number: "031", category: "Fine Art", period: "Contemporary", title: "A Study in Stillness", subtitle: "Framed acrylic and oil work on linen canvas exploring muted warm light.", price: 85000, bids: 4, estimate: "₹65,000 – ₹1,10,000", ends: 65520, image: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=1000&q=85", story: "Large-format gallery canvas finished with layered brushwork and natural mineral pigments, suited for residential or studio spaces." },
    { id: "car", key: "lot-car", number: "042", category: "Automotive", period: "Classic", title: "The Open-Road Icon", subtitle: "1970s European grand touring coupe in restored driver condition.", price: 1850000, bids: 12, estimate: "₹16,00,000 – ₹22,00,000", ends: 86400, image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1000&q=85", story: "Rear-engine classic coupe featuring restored leather upholstery, matching-numbers drivetrain, and documented mechanical servicing." },
    { id: "jewel", key: "lot-jewel", number: "056", category: "Jewellery", period: "Modern heirloom", title: "The Quiet Brilliance", subtitle: "18k yellow-gold collar necklace set with brilliant-cut diamonds.", price: 125000, bids: 5, estimate: "₹1,00,000 – ₹1,60,000", ends: 129600, image: "https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=1000&q=85", story: "Hand-finished 18k gold pendant necklace balanced for everyday evening wear, supplied with a sample appraisal summary." },
    { id: "camera", key: "lot-camera", number: "063", category: "Timepieces", period: "Mid-century", title: "The Photographer’s Companion", subtitle: "All-mechanical 35mm rangefinder camera with fast 50mm f/1.4 prime lens.", price: 42000, bids: 3, estimate: "₹35,000 – ₹60,000", ends: 172800, image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1000&q=85", story: "Classic rangefinder camera built from machined brass and vulcanite wrap, featuring clean viewfinder optics and crisp mechanical shutter speeds." },
    { id: "sculpture", key: "lot-sculpture", number: "071", category: "Fine Art", period: "Contemporary", title: "Form in Conversation", subtitle: "Cast bronze & travertine tabletop sculpture with hand-rubbed patina.", price: 67000, bids: 6, estimate: "₹50,000 – ₹90,000", ends: 216000, image: "https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?auto=format&fit=crop&w=1000&q=85", story: "Abstract figurative bronze study mounted on a solid natural stone plinth, designed to catch directional room lighting." },
    { id: "car-detail", key: "lot-car-detail", number: "084", category: "Automotive", period: "Modern classic", title: "The Grand Touring Line", subtitle: "Two-door performance coupe with naturally aspirated inline engine.", price: 920000, bids: 9, estimate: "₹8,00,000 – ₹12,00,000", ends: 259200, image: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1000&q=85", story: "Well-preserved grand tourer maintained by long-term enthusiasts, offering factory alloys, clean interior trim, and service records." },
    { id: "jewel-detail", key: "lot-jewel-detail", number: "092", category: "Jewellery", period: "Artisan", title: "A Line of Light", subtitle: "Minimalist gold chain and bar bracelet in satin brushed finish.", price: 98000, bids: 2, estimate: "₹80,000 – ₹1,25,000", ends: 302400, image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1000&q=85", story: "Contemporary fine jewelry piece combining hallmarked solid gold links with a concealed box clasp." }
  ],
  articles: [
    {
      id: "mechanical-watchmaking", category: "Watches", readingTime: "6 min read",
      title: "The Art of Mechanical Watchmaking",
      subtitle: "How hand-wound movements work and what collectors check before bidding on a vintage timepiece.",
      image: "https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=1400&q=88",
      caption: "Close-up of a mechanical chronograph movement.", related: ["collector-eye", "jewellery-material"],
      body: [
        { heading: "A slower measure", paragraphs: ["Inside a mechanical watch, mainsprings, gear trains, and escapements turn stored energy into steady second-by-second motion without a battery.", "Collectors value manual and automatic calibres because every component can be serviced and restored decades after manufacture."] },
        { heading: "What to inspect on a dial", paragraphs: ["Check lume consistency, crisp dial lettering, sharp case bevels, and whether the crown and chronograph pushers feel firm and smooth.", "Original unpolished cases and honest patina generally command stronger estimates than over-restored parts."] }
      ]
    },
    {
      id: "fine-art-language", category: "Art", readingTime: "5 min read",
      title: "How Condition & Provenance Affect Art Value",
      subtitle: "Key factors art buyers evaluate: canvas condition, framing, signature, and gallery history.",
      image: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=1400&q=88",
      caption: "Natural lighting across a textured painted canvas.", related: ["collector-eye", "classic-automobiles"],
      body: [
        { heading: "Checking condition first", paragraphs: ["When buying art online, start with high-resolution surface photos. Look for paint stability, clean canvas edges, and uniform framing.", "Provenance—documentation showing where a work was exhibited or previously held—adds confidence to any price estimate."] },
        { heading: "Understanding estimates", paragraphs: ["Auction estimates reflect recent comparable sales, dimensions, medium, and artist demand. Setting a personal ceiling before bidding helps avoid overpaying."] }
      ]
    },
    {
      id: "jewellery-material", category: "Jewellery", readingTime: "4 min read",
      title: "Buying Estate & Fine Jewelry at Auction",
      subtitle: "What hallmarks, craftsmanship, and stone settings tell you beyond raw metal weight.",
      image: "https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=1400&q=88",
      caption: "Hand-set gold jewelry under studio light.", related: ["mechanical-watchmaking", "collector-eye"],
      body: [
        { heading: "Beyond gold weight", paragraphs: ["Precious metal purity is only the starting point. Fine clasps, stone alignment, and comfortable proportions decide whether a piece lasts for generations.", "Look for official purity hallmarks (such as 18k or 750) alongside clean prong work and secure settings."] }
      ]
    },
    {
      id: "collector-eye", category: "Collecting", readingTime: "5 min read",
      title: "How to Evaluate Any Collectible Before Bidding",
      subtitle: "Four practical checks for new bidders: estimates, condition notes, rarity, and long-term care.",
      image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1400&q=88",
      caption: "A classic mechanical rangefinder camera.", related: ["fine-art-language", "jewellery-material"],
      body: [
        { heading: "Start with research", paragraphs: ["Compare the auction estimate range against past results for similar years and models before placing a bid.", "Items with intact serial numbers, original accessories, and complete histories hold value best over time."] },
        { heading: "Using the watchlist", paragraphs: ["Save favorite lots early so you can watch bid activity and remaining time closely before placing a simulated bid."] }
      ]
    },
    {
      id: "classic-automobiles", category: "Automobiles", readingTime: "6 min read",
      title: "What Makes a Classic Car Collectible",
      subtitle: "Originality, service documentation, mechanical character, and body condition explained.",
      image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1400&q=88",
      caption: "Profile of a restored European grand touring coupe.", related: ["mechanical-watchmaking", "collector-eye"],
      body: [
        { heading: "Originality and documentation", paragraphs: ["Enthusiasts prize classic cars with matching chassis and engine numbers, consistent body panel gaps, and organized maintenance invoices.", "Mechanical simplicity and analog gauges remain key reasons analog sports coupes keep gaining interest among younger collectors."] }
      ]
    }
  ]
});

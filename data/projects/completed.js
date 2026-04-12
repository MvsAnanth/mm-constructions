// Completed Projects Data
// To add a new project: copy an existing entry, update the fields, and add to this array.
const COMPLETED_PROJECTS = [
  {
    id: "manoj-heights",
    name: "Manoj Heights",
    tag: "Residential",
    shortLoc: "RTC Colony, Old Safilguda",
    motto: '"Built with Precision, Delivered with Pride"',
    location: "RTC Colony, Old Safilguda, Hyderabad",
    mapsQuery: "RTC+Colony+Old+Safilguda+Hyderabad+Telangana",
    mapsUrl: "https://maps.app.goo.gl/Q6WG5oXaLr4XiLTF6",
    dataDir: "data/Completed/manoj-heights",
    pdf: "data/Completed/manoj-heights/brochure.pdf",
    floorplan: ["data/Completed/manoj-heights/page-2.jpg"],
    brochure: [
      "data/Completed/manoj-heights/page-1.jpg",
      "data/Completed/manoj-heights/page-2.jpg"
    ],
    desc: "A premium residential development in the heart of Old Safilguda, offering thoughtfully designed apartments with quality finishes, excellent ventilation, and convenient access to daily amenities.",
    specs: [
      ["Type", "Residential Apartments"],
      ["Location", "RTC Colony, Old Safilguda, Hyderabad"],
      ["Status", "Completed & Handed Over"],
      ["Structure", "R.C.C. Framed — Sarvotham/Jairaj Steel"],
      ["Flooring", '24" × 24" Vitrified Tiles'],
      ["Joinery", "Indian Teak Wood Frames & UPVC Windows"]
    ]
  },
  {
    id: "manoj-homes-jawahar",
    name: "Manoj Homes",
    tag: "Residential",
    shortLoc: "Jawahar Nagar, Moulali",
    motto: '"Your Dream Address in Jawahar Nagar"',
    location: "Jawahar Nagar, Moulali, Hyderabad",
    mapsQuery: "Jawahar+Nagar+Moulali+Hyderabad+Telangana",
    dataDir: "data/Completed/manoj-homes-jawahar",
    pdf: "data/Completed/manoj-homes-jawahar/brochure.pdf",
    floorplan: ["data/Completed/manoj-homes-jawahar/page-2.jpg"],
    brochure: [
      "data/Completed/manoj-homes-jawahar/page-1.jpg",
      "data/Completed/manoj-homes-jawahar/page-2.jpg"
    ],
    desc: "Premium residential apartments at Jawahar Nagar with modern interiors, quality plumbing and electrical work, and a serene environment close to Moulali. Each unit crafted to maximise light and space.",
    specs: [
      ["Type", "Residential Apartments"],
      ["Location", "Jawahar Nagar, Moulali, Hyderabad"],
      ["Status", "Completed & Handed Over"],
      ["Plumbing", "CERA WC & Taps — Concealed Piping"],
      ["Electricals", "Nakoda Wiring — Anchor Penta Switches"],
      ["Water", "Bore & Manjeera Connection"]
    ]
  },
  {
    id: "manoj-homes-sainikpuri",
    name: "Manoj Homes",
    tag: "Residential",
    shortLoc: "Sainikpuri, Kapra",
    motto: '"Quality Living in Sainikpuri"',
    location: "Sainikpuri, Kapra, Hyderabad",
    mapsQuery: "Sainikpuri+Kapra+Hyderabad+Telangana",
    dataDir: "data/Completed/manoj-homes-sainikpuri",
    pdf: "data/Completed/manoj-homes-sainikpuri/brochure.pdf",
    floorplan: ["data/Completed/manoj-homes-sainikpuri/page-2.jpg"],
    brochure: [
      "data/Completed/manoj-homes-sainikpuri/page-1.jpg",
      "data/Completed/manoj-homes-sainikpuri/page-2.jpg"
    ],
    desc: "Residential apartments in the sought-after Sainikpuri locality with spacious layouts, high-quality construction standards, and close proximity to schools, hospitals, and transport hubs.",
    specs: [
      ["Type", "Residential Apartments"],
      ["Location", "Sainikpuri, Kapra, Hyderabad"],
      ["Status", "Completed & Handed Over"],
      ["Walls", '9" External & 4.5" Internal Brick Walls'],
      ["Painting", "Birla Wall Putty Interior + ACE Exterior"],
      ["Amenities", "Lift, Bore Water, Manjeera Connection"]
    ]
  },
  {
    id: "manoj-residency",
    name: "Manoj Residency",
    tag: "Residential",
    shortLoc: "Officers Colony, Neredmet",
    motto: '"Luxury Redefined at Officers Colony"',
    location: "Officers Colony, Neredmet, Hyderabad",
    mapsQuery: "Officers+Colony+Neredmet+Hyderabad+Telangana",
    dataDir: "data/Completed/manoj-residency",
    pdf: "data/Completed/manoj-residency/brochure.pdf",
    floorplan: ["data/Completed/manoj-residency/page-2.jpg"],
    brochure: [
      "data/Completed/manoj-residency/page-1.jpg",
      "data/Completed/manoj-residency/page-2.jpg"
    ],
    desc: "An upscale residential project in Officers Colony, Neredmet — one of Hyderabad's most desirable neighbourhoods. Designed for families seeking a balance of comfort, quality, and prestige.",
    specs: [
      ["Type", "Residential Apartments"],
      ["Location", "Officers Colony, Neredmet, Hyderabad"],
      ["Status", "Completed & Handed Over"],
      ["Flooring", '24" × 24" Vitrified Tiles'],
      ["Sanitary", "CERA — 7ft Glazed Tile Dado in Toilets"],
      ["Lift", "6-Passenger Lift Provided"]
    ]
  },
  {
    id: "manoj-enclave",
    name: "Meghana Manoj Enclave",
    tag: "Residential",
    shortLoc: "Dindayal Nagar, Malkajgiri",
    motto: '"Not Just A Home, Also Your Dream"',
    location: "Dindayal Nagar, Road No-6, Malkajgiri, Secunderabad",
    mapsQuery: "Dindayal+Nagar+Road+No+6+Malkajgiri+Secunderabad+Hyderabad",
    dataDir: "data/Completed/manoj-enclave",
    pdf: "data/Completed/manoj-enclave/brochure.pdf",
    floorplan: ["data/Completed/manoj-enclave/page-2.jpg"],
    brochure: [
      "data/Completed/manoj-enclave/page-1.jpg",
      "data/Completed/manoj-enclave/page-2.jpg"
    ],
    desc: "Meghana Manoj Enclave at Dindayal Nagar, Malkajgiri — a thoughtfully designed residential community offering 1150 sqft 2BHK apartments with premium finishes, lift access, and excellent connectivity to Secunderabad.",
    specs: [
      ["Type", "Residential Apartments — 2 BHK"],
      ["Location", "Dindayal Nagar, Road No-6, Malkajgiri"],
      ["Status", "Completed & Handed Over"],
      ["Unit Size", "1150 Sqft per Flat"],
      ["Structure", "R.C.C. Framed — Sarvotham/Jairaj Steel"],
      ["Flooring", '24" × 24" Vitrified Tiles'],
      ["Sanitary", "CERA WC & Wash Basins"],
      ["Electricals", "Nakoda Wiring — Anchor Penta Switches"],
      ["Lift", "4-Passenger Standard Make"],
      ["Water", "Bore & Manjeera Connection"],
      ["Painting", "Birla Wall Putty Interior + ACE Exterior"]
    ]
  },
  {
    id: "manoj-homes-uppal",
    name: "Manoj Homes",
    tag: "Residential",
    shortLoc: "Balaji Hill Colony, Uppal",
    motto: '"Quality Living at Balaji Hills, Uppal"',
    location: "Venkateshvara Temple Road, Balaji Hill Colony, Uppal, Hyderabad",
    mapsQuery: "Balaji+Hill+Colony+Uppal+Hyderabad+Telangana",
    dataDir: "data/Completed/manoj-homes-uppal",
    pdf: "data/Completed/manoj-homes-uppal/brochure.pdf",
    floorplan: ["data/Completed/manoj-homes-uppal/page-2.jpg"],
    brochure: [
      "data/Completed/manoj-homes-uppal/page-1.jpg",
      "data/Completed/manoj-homes-uppal/page-2.jpg"
    ],
    desc: "Manoj Homes at Balaji Hill Colony, Uppal — 1025 sqft 2BHK residences with superior construction quality, CERA sanitary fittings, Johnson lift, and proximity to Vijaya Diagnostic Centre, schools, and key transit corridors.",
    specs: [
      ["Type", "Residential Apartments — 2 BHK"],
      ["Location", "Balaji Hill Colony, Uppal, Hyderabad"],
      ["Status", "Completed & Handed Over"],
      ["Unit Size", "1025 Sqft per Flat"],
      ["Structure", "R.C.C. Framed — Sarvotham/Jairaj Steel"],
      ["Flooring", '24" × 24" Vitrified Tiles'],
      ["Sanitary", "CERA — 7ft Glazed Tile Dado in Toilets"],
      ["Joinery", "Indian Teak Wood Frames & UPVC Windows"],
      ["Electricals", "Polycab Wiring — Anchor Penta Switches"],
      ["Lift", "6-Passenger Johnson Make"],
      ["Water", '6.5" Bore & Manjeera Connection']
    ]
  },
  {
    id: "manoj-homes-goutham",
    name: "Manoj Homes",
    tag: "Residential",
    shortLoc: "Goutham Nagar, Malkajgiri",
    motto: '"Spacious 3BHK Living in Goutham Nagar"',
    location: "Goutham Nagar, Malkajgiri, Hyderabad",
    mapsQuery: "Goutham+Nagar+Malkajgiri+Hyderabad+Telangana",
    dataDir: "data/Completed/manoj-homes-goutham",
    pdf: "data/Completed/manoj-homes-goutham/brochure.pdf",
    floorplan: ["data/Completed/manoj-homes-goutham/page-2.jpg"],
    brochure: [
      "data/Completed/manoj-homes-goutham/page-1.jpg",
      "data/Completed/manoj-homes-goutham/page-2.jpg"
    ],
    desc: "Manoj Homes at Goutham Nagar, Malkajgiri — generous 1900 sqft 3BHK apartments featuring a dedicated puja room, wide sit-out, two toilets, and lift access. Crafted for families seeking space and comfort in Hyderabad.",
    specs: [
      ["Type", "Residential Apartments — 3 BHK"],
      ["Location", "Goutham Nagar, Malkajgiri, Hyderabad"],
      ["Status", "Completed & Handed Over"],
      ["Unit Size", "1900 Sqft per Flat"],
      ["Structure", "R.C.C. Framed — Sarvotham/Jairaj Steel"],
      ["Walls", '9" External & 4.5" Internal Brick Walls'],
      ["Flooring", '24" × 24" Vitrified Tiles'],
      ["Sanitary", "CERA WC & Wash Basins — Concealed Piping"],
      ["Joinery", "Indian Teak Wood Frames & UPVC Windows"],
      ["Electricals", "Polycab Wiring — Anchor Penta Switches"],
      ["Water", "Bore & Manjeera Connection"]
    ]
  },
  {
    id: "harivillu",
    name: "Meghana Manoj Harivillu",
    tag: "Residential",
    shortLoc: "Hyderabad",
    motto: '"A Home as Beautiful as Nature"',
    location: "Hyderabad, Telangana",
    mapsQuery: "Meghana+Manoj+Constructions+Malkajgiri+Hyderabad",
    dataDir: "data/Completed/harivillu",
    pdf: "data/Completed/harivillu/brochure.pdf",
    floorplan: ["data/Completed/harivillu/page-2.jpg"],
    brochure: [
      "data/Completed/harivillu/page-1.jpg",
      "data/Completed/harivillu/page-2.jpg"
    ],
    desc: '"Harivillu" — meaning Home of Hari — is a signature residential project by Meghana Manoj Constructions, blending traditional values with modern construction standards. A proud landmark in Hyderabad.',
    specs: [
      ["Type", "Residential Apartments"],
      ["Location", "Hyderabad, Telangana"],
      ["Status", "Completed & Handed Over"],
      ["Brand", "Meghana Manoj Constructions & Builders"],
      ["Est.", "2017 — Building Trust Since Inception"],
      ["Contact", "+91 92461 84092"]
    ]
  }
];

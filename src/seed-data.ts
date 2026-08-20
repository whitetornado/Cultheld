import { supabase } from './lib/supabase';

const EREDIVISIE_CLUBS = [
  { name: 'Ajax', slug: 'ajax', city: 'Amsterdam' },
  { name: 'PSV', slug: 'psv', city: 'Eindhoven' },
  { name: 'Feyenoord', slug: 'feyenoord', city: 'Rotterdam' },
  { name: 'AZ', slug: 'az', city: 'Alkmaar' },
  { name: 'FC Utrecht', slug: 'fc-utrecht', city: 'Utrecht' },
  { name: 'FC Twente', slug: 'fc-twente', city: 'Enschede' },
  { name: 'Vitesse', slug: 'vitesse', city: 'Arnhem' },
  { name: 'SC Heerenveen', slug: 'sc-heerenveen', city: 'Heerenveen' },
  { name: 'FC Groningen', slug: 'fc-groningen', city: 'Groningen' },
  { name: 'Sparta Rotterdam', slug: 'sparta-rotterdam', city: 'Rotterdam' },
  { name: 'PEC Zwolle', slug: 'pec-zwolle', city: 'Zwolle' },
  { name: 'Heracles Almelo', slug: 'heracles-almelo', city: 'Almelo' },
  { name: 'Fortuna Sittard', slug: 'fortuna-sittard', city: 'Sittard' },
  { name: 'Go Ahead Eagles', slug: 'go-ahead-eagles', city: 'Deventer' },
  { name: 'NEC', slug: 'nec', city: 'Nijmegen' },
  { name: 'RKC Waalwijk', slug: 'rkc-waalwijk', city: 'Waalwijk' },
  { name: 'FC Volendam', slug: 'fc-volendam', city: 'Volendam' },
  { name: 'Excelsior', slug: 'excelsior', city: 'Rotterdam' },
];

export async function seedDatabase() {
  console.log('Starting database seed...');

  const { data: { user } } = await supabase.auth.getUser();
  console.log('Current user:', user?.email);

  console.log('1. Creating product types...');
  const { error: productTypesError } = await supabase.from('product_types').upsert([
    {
      id: 'tshirt',
      name: 'T-Shirt',
      description: 'Premium katoenen t-shirt',
      base_price: 29.99,
    },
    {
      id: 'hoodie',
      name: 'Hoodie',
      description: 'Comfortable hoodie met capuchon',
      base_price: 54.99,
    },
    {
      id: 'sweater',
      name: 'Sweater',
      description: 'Premium sweater',
      base_price: 44.99,
    },
  ], { onConflict: 'id' });

  if (productTypesError) {
    console.error('Error creating product types:', productTypesError);
  } else {
    console.log('Product types created');
  }

  console.log('2. Creating product variants...');
  const colors = [
    { name: 'Wit', hex: '#FFFFFF' },
    { name: 'Zwart', hex: '#000000' },
    { name: 'Grijs', hex: '#9CA3AF' },
  ];

  const sizes = ['S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
  const variants = [];

  for (const type of ['tshirt', 'hoodie', 'sweater']) {
    for (const color of colors) {
      for (const size of sizes) {
        variants.push({
          product_type_id: type,
          color_name: color.name,
          color_hex: color.hex,
          size,
          price: type === 'tshirt' ? 29.99 : type === 'hoodie' ? 54.99 : 44.99,
          mockup_image_url: color.name === 'Wit' ? '/mockups/legend_op_shirt_white.jpg' : '/mockups/legend_op_shirt.jpg',
          available: true,
        });
      }
    }
  }

  const { error: variantsError } = await supabase.from('product_variants').insert(variants);

  if (variantsError) {
    console.error('Error creating variants:', variantsError);
  } else {
    console.log(`Created ${variants.length} product variants`);
  }

  console.log('3. Creating seasons...');
  const { data: seasons, error: seasonsError } = await supabase
    .from('seasons')
    .insert([
      {
        name: '2022/23',
        start_year: 2022,
        end_year: 2023,
        is_active: false,
        sort_order: 1,
      },
      {
        name: '2023/24',
        start_year: 2023,
        end_year: 2024,
        is_active: true,
        sort_order: 2,
      },
    ])
    .select();

  if (seasonsError) {
    console.error('Error creating seasons:', seasonsError);
  } else {
    console.log('Seasons created:', seasons?.length);
  }

  console.log('4. Creating clubs...');
  const activeSeason = seasons?.find(s => s.is_active);
  const clubsWithSeason = EREDIVISIE_CLUBS.map(club => ({
    ...club,
    season_id: activeSeason?.id || null,
  }));

  const { data: clubs, error: clubsError } = await supabase
    .from('clubs')
    .insert(clubsWithSeason)
    .select();

  if (clubsError) {
    console.error('Error creating clubs:', clubsError);
  } else {
    console.log('Clubs created:', clubs?.length);
  }

  console.log('5. Creating legends...');
  const globalLegends = [
    {
      name: 'Pelé',
      slug: 'pele',
      bio: 'Braziliaanse voetballegende. Drievoudig wereldkampioen en meest iconische speler aller tijden.',
      png_url: '/legends/afe0f531-76dd-4f05-af43-0c5fe6d1eca6.png',
      category: 'world',
      club_id: null,
    },
    {
      name: 'Diego Maradona',
      slug: 'diego-maradona',
      bio: 'Argentijnse maestro. Wereldkampioen 1986 en een van de grootste voetballers ooit.',
      png_url: '/legends/legend-alt.png',
      category: 'world',
      club_id: null,
    },
    {
      name: 'Johan Cruijff',
      slug: 'johan-cruijff',
      bio: 'Nederlandse voetbalfilosoof. Revolutionair speler en trainer, icoon van het totaalvoetbal.',
      png_url: '/legends/legend.png',
      category: 'world',
      club_id: null,
    },
  ];

  const { data: createdGlobalLegends, error: globalLegendsError } = await supabase
    .from('legends')
    .insert(globalLegends)
    .select();

  if (globalLegendsError) {
    console.error('Error creating global legends:', globalLegendsError);
  } else {
    console.log('Global legends created:', createdGlobalLegends?.length);
  }

  if (seasons && seasons.length > 0 && clubs && clubs.length > 0) {
    console.log('6. Creating eredivisie legends for clubs...');

    for (const season of seasons) {
      const topClubs = clubs.slice(0, 6);

      for (const club of topClubs) {
        const clubLegends = [];

        for (let i = 1; i <= 4; i++) {
          clubLegends.push({
            name: `${club.name} Legend ${i}`,
            slug: `${club.slug}-legend-${i}-${season.start_year}`,
            bio: `Cultheld van ${club.name} uit seizoen ${season.name}. Een icoon die geschiedenis schreef.`,
            png_url: i % 3 === 0 ? '/legends/afe0f531-76dd-4f05-af43-0c5fe6d1eca6.png' : i % 2 === 0 ? '/legends/legend-alt.png' : '/legends/legend.png',
            category: 'eredivisie',
            club_id: club.id,
          });
        }

        const { data: createdLegends, error: legendsError } = await supabase
          .from('legends')
          .insert(clubLegends)
          .select();

        if (legendsError) {
          console.error(`Error creating legends for ${club.name}:`, legendsError);
        } else if (createdLegends) {
          const assignments = createdLegends.map((legend) => ({
            season_id: season.id,
            club_id: club.id,
            legend_id: legend.id,
          }));

          const { error: assignError } = await supabase
            .from('legend_assignments')
            .insert(assignments);

          if (assignError) {
            console.error(`Error creating assignments for ${club.name}:`, assignError);
          } else {
            console.log(`Created 4 legends for ${club.name} in ${season.name}`);
          }
        }
      }
    }
  }

  console.log('Database seeding complete!');
}

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Aura Stream database...\n');

  // ── Users ─────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('password123', 10);

  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@aurastream.com' },
    update: {},
    create: {
      email: 'demo@aurastream.com',
      username: 'demo_listener',
      passwordHash,
      bio: 'A lover of ambient soundtracks and synthwave beats.',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80',
      role: 'USER',
    },
  });

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@aurastream.com' },
    update: {
      passwordHash: await bcrypt.hash('Mano@891', 10),
    },
    create: {
      email: 'admin@aurastream.com',
      username: 'aura_admin',
      passwordHash: await bcrypt.hash('Mano@891', 10),
      bio: 'Aura Stream platform administrator.',
      avatarUrl: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&w=150&h=150&q=80',
      role: 'ADMIN',
    },
  });

  const musicFanUser = await prisma.user.upsert({
    where: { email: 'musicfan@aurastream.com' },
    update: {},
    create: {
      email: 'musicfan@aurastream.com',
      username: 'melody_seeker',
      passwordHash,
      bio: 'Finding beauty in every chord progression.',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80',
      role: 'USER',
    },
  });

  console.log('✅ Users seeded:', demoUser.username, adminUser.username, musicFanUser.username);

  // ── Artists ───────────────────────────────────────────────────────
  const hansZimmer = await prisma.artist.upsert({
    where: { name: 'Hans Zimmer' },
    update: {},
    create: {
      name: 'Hans Zimmer',
      youtubeChannelId: 'UCy9g5V4-6H_10z370e0yFUA',
      bio: 'Legendary composer of Interstellar, Inception, and The Dark Knight.',
      avatarUrl: 'https://images.unsplash.com/photo-1444084316824-dc269f705b2b?auto=format&fit=crop&w=150&h=150&q=80',
    },
  });

  const daftPunk = await prisma.artist.upsert({
    where: { name: 'Daft Punk' },
    update: {},
    create: {
      name: 'Daft Punk',
      youtubeChannelId: 'UC3W2T_UCZlh3UiwWjG5zT3A',
      bio: 'French electronic music duo, active 1993-2021.',
      avatarUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=150&h=150&q=80',
    },
  });

  const theWeeknd = await prisma.artist.upsert({
    where: { name: 'The Weeknd' },
    update: {},
    create: {
      name: 'The Weeknd',
      youtubeChannelId: 'UCiiSGf1WJMd6exg7uQHEWAg',
      bio: 'Canadian singer and record producer known for dark R&B and synth-pop.',
      avatarUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=150&h=150&q=80',
    },
  });

  const theXX = await prisma.artist.upsert({
    where: { name: 'The xx' },
    update: {},
    create: {
      name: 'The xx',
      youtubeChannelId: 'UCz5lPmT3nJqRDmMqWg4D8Tw',
      bio: 'British indie pop trio from London.',
      avatarUrl: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&w=150&h=150&q=80',
    },
  });

  const maxRichter = await prisma.artist.upsert({
    where: { name: 'Max Richter' },
    update: {},
    create: {
      name: 'Max Richter',
      youtubeChannelId: 'UClhXJCCBtHD7e9wrb1kJSIg',
      bio: 'German-British composer known for On the Nature of Daylight.',
    },
  });

  console.log('✅ Artists seeded: Hans Zimmer, Daft Punk, The Weeknd, The xx, Max Richter');

  // ── Songs ─────────────────────────────────────────────────────────
  const cornfieldChase = await prisma.song.upsert({
    where: { youtubeId: '1_ZwbJ40X-I' },
    update: {},
    create: {
      youtubeId: '1_ZwbJ40X-I',
      title: 'Cornfield Chase',
      artistId: hansZimmer.id,
      artistName: hansZimmer.name,
      albumName: 'Interstellar Soundtrack',
      durationSeconds: 126,
      thumbnailUrl: 'https://img.youtube.com/vi/1_ZwbJ40X-I/mqdefault.jpg',
    },
  });

  const getLucky = await prisma.song.upsert({
    where: { youtubeId: '5NV6Rdv1a3I' },
    update: {},
    create: {
      youtubeId: '5NV6Rdv1a3I',
      title: 'Get Lucky (feat. Pharrell Williams)',
      artistId: daftPunk.id,
      artistName: daftPunk.name,
      albumName: 'Random Access Memories',
      durationSeconds: 248,
      thumbnailUrl: 'https://img.youtube.com/vi/5NV6Rdv1a3I/mqdefault.jpg',
    },
  });

  const starboy = await prisma.song.upsert({
    where: { youtubeId: '34Na4j8AVgA' },
    update: {},
    create: {
      youtubeId: '34Na4j8AVgA',
      title: 'Starboy',
      artistId: theWeeknd.id,
      artistName: theWeeknd.name,
      albumName: 'Starboy',
      durationSeconds: 230,
      thumbnailUrl: 'https://img.youtube.com/vi/34Na4j8AVgA/mqdefault.jpg',
    },
  });

  const intro = await prisma.song.upsert({
    where: { youtubeId: 'fKpUBsn_jmA' },
    update: {},
    create: {
      youtubeId: 'fKpUBsn_jmA',
      title: 'Intro',
      artistId: theXX.id,
      artistName: theXX.name,
      albumName: 'xx',
      durationSeconds: 128,
      thumbnailUrl: 'https://img.youtube.com/vi/fKpUBsn_jmA/mqdefault.jpg',
    },
  });

  const natureOfDaylight = await prisma.song.upsert({
    where: { youtubeId: 'Dka2p4hS924' },
    update: {},
    create: {
      youtubeId: 'Dka2p4hS924',
      title: 'On The Nature of Daylight',
      artistId: maxRichter.id,
      artistName: maxRichter.name,
      albumName: 'The Blue Notebooks',
      durationSeconds: 312,
      thumbnailUrl: 'https://img.youtube.com/vi/Dka2p4hS924/mqdefault.jpg',
    },
  });

  console.log('✅ Songs seeded:', cornfieldChase.title, getLucky.title, starboy.title, intro.title, natureOfDaylight.title);

  // ── Playlists ─────────────────────────────────────────────────────
  const ambientPlaylist = await prisma.playlist.upsert({
    where: { id: 'seed-playlist-ambient-001' },
    update: {},
    create: {
      id: 'seed-playlist-ambient-001',
      title: 'Ambient Journeys',
      description: 'Vast soundscapes and cinematic orchestral pieces to drift away.',
      coverUrl: 'https://images.unsplash.com/photo-1444084316824-dc269f705b2b?auto=format&fit=crop&w=400&h=400&q=80',
      ownerId: demoUser.id,
      isPrivate: false,
      isCollaborative: false,
    },
  });

  await prisma.playlistSong.upsert({
    where: { id: 'seed-ps-001' },
    update: {},
    create: { id: 'seed-ps-001', playlistId: ambientPlaylist.id, songId: cornfieldChase.id, position: 1 },
  });

  await prisma.playlistSong.upsert({
    where: { id: 'seed-ps-002' },
    update: {},
    create: { id: 'seed-ps-002', playlistId: ambientPlaylist.id, songId: natureOfDaylight.id, position: 2 },
  });

  await prisma.playlistSong.upsert({
    where: { id: 'seed-ps-003' },
    update: {},
    create: { id: 'seed-ps-003', playlistId: ambientPlaylist.id, songId: intro.id, position: 3 },
  });

  const partyPlaylist = await prisma.playlist.upsert({
    where: { id: 'seed-playlist-party-001' },
    update: {},
    create: {
      id: 'seed-playlist-party-001',
      title: 'Midnight Vibes',
      description: 'Dance hits and electronic bangers for late nights.',
      coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&h=400&q=80',
      ownerId: musicFanUser.id,
      isPrivate: false,
      isCollaborative: true,
    },
  });

  await prisma.playlistSong.upsert({
    where: { id: 'seed-ps-004' },
    update: {},
    create: { id: 'seed-ps-004', playlistId: partyPlaylist.id, songId: getLucky.id, position: 1 },
  });

  await prisma.playlistSong.upsert({
    where: { id: 'seed-ps-005' },
    update: {},
    create: { id: 'seed-ps-005', playlistId: partyPlaylist.id, songId: starboy.id, position: 2 },
  });

  console.log('✅ Playlists seeded: Ambient Journeys, Midnight Vibes');

  // ── Social data ───────────────────────────────────────────────────
  // demo_listener follows melody_seeker
  await prisma.follow.upsert({
    where: {
      followerId_followingId: {
        followerId: demoUser.id,
        followingId: musicFanUser.id,
      },
    },
    update: {},
    create: {
      followerId: demoUser.id,
      followingId: musicFanUser.id,
    },
  });

  // melody_seeker follows demo_listener
  await prisma.follow.upsert({
    where: {
      followerId_followingId: {
        followerId: musicFanUser.id,
        followingId: demoUser.id,
      },
    },
    update: {},
    create: {
      followerId: musicFanUser.id,
      followingId: demoUser.id,
    },
  });

  // Listening history (demo_listener)
  await prisma.listeningHistory.create({
    data: {
      userId: demoUser.id,
      songId: cornfieldChase.id,
      durationListenedSeconds: 126,
    },
  }).catch(() => {}); // Ignore duplicate errors on re-seed

  // Listening history (melody_seeker)
  await prisma.listeningHistory.create({
    data: {
      userId: musicFanUser.id,
      songId: getLucky.id,
      durationListenedSeconds: 248,
    },
  }).catch(() => {});

  await prisma.listeningHistory.create({
    data: {
      userId: musicFanUser.id,
      songId: starboy.id,
      durationListenedSeconds: 230,
    },
  }).catch(() => {});

  console.log('✅ Social data seeded (follows, history)');
  console.log('\n🎉 Seed complete! Login credentials:');
  console.log('   Email: demo@aurastream.com  | Password: password123');
  console.log('   Email: admin@aurastream.com | Password: Mano@891');
  console.log('   Email: musicfan@aurastream.com | Password: password123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

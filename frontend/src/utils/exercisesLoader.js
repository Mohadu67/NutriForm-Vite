
export async function loadExercises(types = 'all') {
  const fileMap = {
    muscu: '/data/exo/muscu.json',
    cardio: '/data/exo/cardio.json',
    yoga: '/data/exo/yoga.json',
    meditation: '/data/exo/meditation.json',
    natation: '/data/exo/natation.json',
    etirement: '/data/exo/etirement.json',
    hiit: '/data/exo/hiit.json',
  };

  
  if (types === 'all') {
    types = Object.keys(fileMap);
  }

  
  const typeArray = Array.isArray(types) ? types : [types];

  
  const promises = typeArray.map(async (type) => {
    const url = fileMap[type];
    if (!url) {
      return [];
    }

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.exercises || [];
    } catch (error) {
      return [];
    }
  });

  const results = await Promise.all(promises);

  
  return results.flat();
}


export async function loadData(dataKey) {
  try {
    const res = await fetch('/data/db.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data[dataKey] || null;
  } catch (error) {
    return null;
  }
}

export const categories = [
  { id: 'recommended', labelJa: 'おすすめ', labelEn: 'Recommended', icon: 'Star' },
  { id: 'morning', labelJa: 'モーニング', labelEn: 'Morning', icon: 'Sunrise' },
  { id: 'sets', labelJa: 'お得なセット', labelEn: 'Value Sets', icon: 'ConciergeBell' },
  { id: 'drinks', labelJa: 'ドリンク', labelEn: 'Drinks', icon: 'Coffee' },
  { id: 'foods', labelJa: 'フード', labelEn: 'Foods', icon: 'Sandwich' },
  { id: 'snacks', labelJa: 'スナック', labelEn: 'Snacks', icon: 'Cookie' },
  { id: 'desserts', labelJa: 'デザート', labelEn: 'Desserts', icon: 'Cake' },
];

export const menuItems = [
  // レコメンド (Recommended)
  {
    id: 'r1',
    categoryId: 'recommended',
    nameJa: '店長特製モーニングセット',
    nameEn: 'Manager\'s Special Morning Set',
    price: 850,
    description: '厚切りのトーストと自家製ジャム、ゆで卵、そしてこだわりのドリップコーヒーがついた一番人気のセットです。',
    image: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&q=80&w=600&h=400'
  },
  {
    id: 'r2',
    categoryId: 'recommended',
    nameJa: '季節のプレミアムパフェ',
    nameEn: 'Seasonal Premium Parfait',
    price: 1200,
    description: '旬のフルーツをふんだんに使った贅沢なパフェ。手作りのジェラートとサクサクのパイ生地が絶妙なバランスです。',
    image: 'https://images.unsplash.com/photo-1563805042-7684c8e9e9cb?auto=format&fit=crop&q=80&w=600&h=400'
  },

  // モーニング (Morning)
  {
    id: 'm1',
    categoryId: 'morning',
    nameJa: '定番モーニング（厚切りトースト＆ゆで卵）',
    nameEn: 'Classic Morning (Toast & Boiled Egg)',
    price: 500,
    description: '外はサクッと、中はふんわり焼き上げた厚切りトーストに、ゆで卵がついた定番のモーニングセットです。',
    image: 'https://images.unsplash.com/photo-1525351484163-f52960a5cdb8?auto=format&fit=crop&q=80&w=600&h=400'
  },
  {
    id: 'm2',
    categoryId: 'morning',
    nameJa: 'モーニングB（ミニサラダ付き）',
    nameEn: 'Morning B (with Mini Salad)',
    price: 650,
    description: 'トーストとゆで卵に、シャキシャキの新鮮なミニサラダを加えたバランスの良い朝食セット。',
    image: 'https://images.unsplash.com/photo-1495214783159-3503fd1b572d?auto=format&fit=crop&q=80&w=600&h=400'
  },

  // セット (Sets)
  {
    id: 'st1',
    categoryId: 'sets',
    nameJa: 'サンドイッチ＆スープセット',
    nameEn: 'Sandwich & Soup Set',
    price: 1100,
    description: 'お好きなサンドイッチ1品と、本日の日替わりスープ（ポタージュまたはミネストローネ）の体に優しいセット。',
    image: 'https://images.unsplash.com/photo-1548943487-a2e4f43b4850?auto=format&fit=crop&q=80&w=600&h=400'
  },
  {
    id: 'st2',
    categoryId: 'sets',
    nameJa: 'ケーキ＆ドリンクセット',
    nameEn: 'Cake & Drink Set',
    price: 950,
    description: 'ショーケースのケーキと、コーヒーまたは紅茶のセット。午後のティータイムにぴったりです。',
    image: 'https://images.unsplash.com/photo-1559553156-2e97137af4b1?auto=format&fit=crop&q=80&w=600&h=400'
  },

  // ドリンク (Drinks)
  {
    id: 'd1',
    categoryId: 'drinks',
    nameJa: 'クラフト・ラテ',
    nameEn: 'Craft Latte',
    price: 480,
    description: '厳選したエスプレッソ豆に、きめ細かくスチームしたミルクをたっぷり注いだ、まろやかで香り高いラテです。',
    image: 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&q=80&w=600&h=400'
  },
  {
    id: 'd2',
    categoryId: 'drinks',
    nameJa: 'ドリップコーヒー',
    nameEn: 'Drip Coffee',
    price: 400,
    description: '世界中から集めたスペシャルティコーヒー豆を、ご注文ごとに丁寧にハンドドリップで抽出します。',
    image: 'https://images.unsplash.com/photo-1559525839-b184a4d698c7?auto=format&fit=crop&q=80&w=600&h=400'
  },
  {
    id: 'd3',
    categoryId: 'drinks',
    nameJa: '抹茶ラテ',
    nameEn: 'Matcha Latte',
    price: 520,
    description: '京都宇治産の高級一番茶のみを使用。上質な抹茶のほろ苦さとミルクの甘みが調和した一杯。',
    image: 'https://images.unsplash.com/photo-1515823662972-da6a2e4d3002?auto=format&fit=crop&q=80&w=600&h=400'
  },
  {
    id: 'd4',
    categoryId: 'drinks',
    nameJa: 'アールグレイティー',
    nameEn: 'Earl Grey Tea',
    price: 450,
    description: 'ベルガモットの爽やかな香りが広がるフレーバーティー。ストレートでもミルクでも美味しくお召し上がりいただけます。',
    image: 'https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&q=80&w=600&h=400'
  },

  // フード (Foods)
  {
    id: 'f1',
    categoryId: 'foods',
    nameJa: 'B.L.T. サンドイッチ',
    nameEn: 'B.L.T. Sandwich',
    price: 650,
    description: '香ばしいベーコン、シャキシャキのレタス、新鮮なトマトを、軽くトーストしたライ麦パンでサンドしました。',
    image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&q=80&w=600&h=400'
  },
  {
    id: 'f2',
    categoryId: 'foods',
    nameJa: 'アボカドトースト',
    nameEn: 'Avocado Toast',
    price: 780,
    description: 'クリーミーなアボカドを贅沢にのせたオープントースト。レモン汁とブラックペッパーでアクセントを加えています。',
    image: 'https://images.unsplash.com/photo-1613768560183-e8ec4345224e?auto=format&fit=crop&q=80&w=600&h=400' 
  },
  {
    id: 'f3',
    categoryId: 'foods',
    nameJa: '自家製キッシュ',
    nameEn: 'Homemade Quiche',
    price: 550,
    description: 'ほうれん草とベーコンがたっぷり入ったバター香るサクサクのキッシュ。温めてご提供します。',
    image: 'https://images.unsplash.com/photo-1481931098730-318b6f776db0?auto=format&fit=crop&q=80&w=600&h=400'
  },

  // スナック (Snacks)
  {
    id: 'sn1',
    categoryId: 'snacks',
    nameJa: 'ガーリックポテトフライ',
    nameEn: 'Garlic French Fries',
    price: 380,
    description: '揚げたてのポテトに、特製ガーリックバターとパセリを絡めた、やみつきになる一品。',
    image: 'https://images.unsplash.com/photo-1576107232684-1279f390859f?auto=format&fit=crop&q=80&w=600&h=400'
  },
  {
    id: 'sn2',
    categoryId: 'snacks',
    nameJa: '自家製ピクルス盛り合わせ',
    nameEn: 'Assorted Homemade Pickles',
    price: 320,
    description: '彩り豊かな季節の野菜を、さっぱりとした酸味のオリジナルスパイス液に漬け込みました。',
    image: 'https://images.unsplash.com/photo-1596704017254-9b121068fb31?auto=format&fit=crop&q=80&w=600&h=400'
  },

  // デザート (Desserts)
  {
    id: 's1',
    categoryId: 'desserts',
    nameJa: 'クラシック・パンケーキ',
    nameEn: 'Classic Pancakes',
    price: 850,
    description: '外はサクッと、中はふわふわに焼き上げたバターミルクたっぷりのパンケーキ。メープルシロップでどうぞ。',
    image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&q=80&w=600&h=400'
  },
  {
    id: 's2',
    categoryId: 'desserts',
    nameJa: 'バスク風チーズケーキ',
    nameEn: 'Basque Cheesecake',
    price: 580,
    description: '高温で焼き上げ、あえて焦げ目をつけることでカラメルのような香ばしさと、中のとろける濃厚さを両立しました。',
    image: 'https://images.unsplash.com/photo-1524351199678-941a58a3df50?auto=format&fit=crop&q=80&w=600&h=400'
  },
  {
    id: 's3',
    categoryId: 'desserts',
    nameJa: '季節のフルーツタルト',
    nameEn: 'Seasonal Fruit Tart',
    price: 620,
    description: 'サクサクのタルト生地に濃厚なカスタードクリームを敷き、その時期一番美味しい旬のフルーツを満載にしました。',
    image: 'https://images.unsplash.com/photo-1519869325930-281384150729?auto=format&fit=crop&q=80&w=600&h=400'
  }
];

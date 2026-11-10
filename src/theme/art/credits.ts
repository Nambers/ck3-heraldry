// Pictures behind the pages (src/theme/art/*.webp): what they are and where
// they came from. Every picture is made between 867 and 1453 (CK3's years), is
// public domain or openly licensed, and is listed on the license page. The
// files here are cropped, resized and turned into ink masks (the paper made
// transparent) from the originals linked below.
// test/data.test.ts checks that every picture has an entry and every entry a picture.

export type Text = { zh: string; en: string };

export interface Credit {
  /** file name in src/theme/art/ */
  file: string;
  title: Text;
  /** who and when */
  made: Text;
  /** where the original is kept (empty if the source does not say) */
  held: Text;
  /** the Wikimedia Commons page, with the full licence information */
  page: string;
  /** the original file our copy was made from */
  original: string;
  license: string;
}

export const CREDITS: Credit[] = [
  {
    file: "west-l.webp",
    title: { zh: "《马内塞古抄本》第 52r 页：瓦尔特·冯·克林根比武", en: "Codex Manesse, fol. 52r: Walther von Klingen jousting" },
    made: { zh: "马内塞古抄本画师，约 1305–1315 年", en: "Master of the Codex Manesse, c. 1305–1315" },
    held: { zh: "海德堡大学图书馆，Cod. Pal. germ. 848", en: "Heidelberg University Library, Cod. Pal. germ. 848" },
    page: "https://commons.wikimedia.org/wiki/File:Codex_Manesse_052r_Walther_von_Klingen_(detail).jpg",
    original: "https://upload.wikimedia.org/wikipedia/commons/0/08/Codex_Manesse_052r_Walther_von_Klingen_%28detail%29.jpg",
    license: "Public domain",
  },
  {
    file: "west-r.webp",
    title: { zh: "的黎波里之围（1289 年），出自热那亚的科卡雷利抄本", en: "The fall of Tripoli (1289), from the Cocharelli treatise, Genoa" },
    made: { zh: "热那亚，14 世纪", en: "Genoa, 14th century" },
    held: { zh: "大英图书馆，Add MS 27695, fol. 5", en: "British Library, Add MS 27695, fol. 5" },
    page: "https://commons.wikimedia.org/wiki/File:Siege_of_Tripoli_Painting_(1289).jpg",
    original: "https://upload.wikimedia.org/wikipedia/commons/5/59/Siege_of_Tripoli_Painting_%281289%29.jpg",
    license: "Public domain",
  },
  {
    file: "clergy-l.webp",
    title: { zh: "林肯主教罗伯特·格罗斯泰斯特像", en: "Robert Grosseteste, Bishop of Lincoln" },
    made: { zh: "英格兰，14 世纪初", en: "England, early 14th century" },
    held: { zh: "大英图书馆，Harley MS 3860, f. 48", en: "British Library, Harley MS 3860, f. 48" },
    page: "https://commons.wikimedia.org/wiki/File:Grosseteste_bishop.jpg",
    original: "https://upload.wikimedia.org/wikipedia/commons/e/e3/Grosseteste_bishop.jpg",
    license: "Public domain",
  },
  {
    file: "clergy-r.webp",
    title: { zh: "《埃德温诗篇》：抄写员埃德温", en: "Eadwine Psalter: Eadwine the scribe" },
    made: { zh: "坎特伯雷基督教会修道院，12 世纪中叶", en: "Christ Church, Canterbury, mid-12th century" },
    held: { zh: "剑桥大学三一学院，MS R.17.1, fol. 283v", en: "Trinity College, Cambridge, MS R.17.1, fol. 283v" },
    page: "https://commons.wikimedia.org/wiki/File:Unknown-artist-eadwine-the-scribe-at-work-eadwine-psalter-christ-church-canterbury-england-uk-circa-1160-70.jpg",
    original: "https://upload.wikimedia.org/wikipedia/commons/4/48/Unknown-artist-eadwine-the-scribe-at-work-eadwine-psalter-christ-church-canterbury-england-uk-circa-1160-70.jpg",
    license: "Public domain",
  },
  {
    file: "merchant-l.webp",
    title: { zh: "《健康全书》：药材铺", en: "Tacuinum Sanitatis: an apothecary's shop" },
    made: { zh: "意大利北部，14 世纪", en: "Northern Italy, 14th century" },
    held: { zh: "", en: "" },
    page: "https://commons.wikimedia.org/wiki/File:42-aspetti_di_vita_quotidiana,_medicine,_Taccuino_Sanitatis.jpg",
    original: "https://upload.wikimedia.org/wikipedia/commons/d/da/42-aspetti_di_vita_quotidiana%2C_medicine%2C_Taccuino_Sanitatis.jpg",
    license: "Public domain",
  },
  {
    file: "merchant-r.webp",
    title: { zh: "《健康全书》：呢绒衣料", en: "Tacuinum Sanitatis: woollen cloth" },
    made: { zh: "意大利北部，14 世纪", en: "Northern Italy, 14th century" },
    held: { zh: "", en: "" },
    page: "https://commons.wikimedia.org/wiki/File:57-aspetti_di_vita_quotidiana,_abbigliamento_lana,Taccuino.jpg",
    original: "https://upload.wikimedia.org/wikipedia/commons/0/05/57-aspetti_di_vita_quotidiana%2C_abbigliamento_lana%2CTaccuino.jpg",
    license: "Public domain",
  },
  {
    file: "byzantium-l.webp",
    title: { zh: "斯基里齐斯抄本：希腊火", en: "Madrid Skylitzes: Greek fire" },
    made: { zh: "西西里，12 世纪", en: "Sicily, 12th century" },
    held: { zh: "西班牙国家图书馆，Vitr. 26-2, fol. 34v", en: "Biblioteca Nacional de España, Vitr. 26-2, fol. 34v" },
    page: "https://commons.wikimedia.org/wiki/File:Greekfire-madridskylitzes1.jpg",
    original: "https://upload.wikimedia.org/wikipedia/commons/f/f7/Greekfire-madridskylitzes1.jpg",
    license: "Public domain",
  },
  {
    file: "byzantium-r.webp",
    title: { zh: "斯基里齐斯抄本：骑兵交战", en: "Madrid Skylitzes: a cavalry fight" },
    made: { zh: "西西里，12 世纪", en: "Sicily, 12th century" },
    held: { zh: "西班牙国家图书馆，Vitr. 26-2, fol. 34v", en: "Biblioteca Nacional de España, Vitr. 26-2, fol. 34v" },
    page: "https://commons.wikimedia.org/wiki/File:MadridSkylitzesFol34v.jpg",
    original: "https://upload.wikimedia.org/wikipedia/commons/6/60/MadridSkylitzesFol34v.jpg",
    license: "Public domain",
  },
  {
    file: "islam-l.webp",
    title: { zh: "哈里里《玛卡梅》：行军", en: "Maqamat of al-Hariri: an army on the march" },
    made: { zh: "叶海亚·瓦西提，1237 年", en: "Yahya ibn Mahmud al-Wasiti, 1237" },
    held: { zh: "法国国家图书馆，Arabe 5847", en: "Bibliothèque nationale de France, Arabe 5847" },
    page: "https://commons.wikimedia.org/wiki/File:Yahy%C3%A2_ibn_Mahm%C3%BBd_al-W%C3%A2sit%C3%AE_005.jpg",
    original: "https://upload.wikimedia.org/wikipedia/commons/d/d1/Yahy%C3%A2_ibn_Mahm%C3%BBd_al-W%C3%A2sit%C3%AE_005.jpg",
    license: "Public domain",
  },
  {
    file: "islam-r.webp",
    title: { zh: "哈里里《玛卡梅》：宫廷", en: "Maqamat of al-Hariri: a court" },
    made: { zh: "叶海亚·瓦西提，1237 年", en: "Yahya ibn Mahmud al-Wasiti, 1237" },
    held: { zh: "法国国家图书馆，Arabe 5847", en: "Bibliothèque nationale de France, Arabe 5847" },
    page: "https://commons.wikimedia.org/wiki/File:Yahy%C3%A2_ibn_Mahm%C3%BBd_al-W%C3%A2sit%C3%AE_003.jpg",
    original: "https://upload.wikimedia.org/wikipedia/commons/a/a0/Yahy%C3%A2_ibn_Mahm%C3%BBd_al-W%C3%A2sit%C3%AE_003.jpg",
    license: "Public domain",
  },
  {
    file: "steppe-l.webp",
    title: { zh: "《史集》：蒙古与金的战斗（1211 年）", en: "Jami' al-tawarikh: Mongols and Jin at war (1211)" },
    made: { zh: "赫拉特，约 1430 年", en: "Herat, c. 1430" },
    held: { zh: "法国国家图书馆，Supplément persan 1113, fol. 49", en: "Bibliothèque nationale de France, Supplément persan 1113, fol. 49" },
    page: "https://commons.wikimedia.org/wiki/File:Bataille_entre_mongols_%26_chinois_(1211).jpeg",
    original: "https://upload.wikimedia.org/wikipedia/commons/c/c0/Bataille_entre_mongols_%26_chinois_%281211%29.jpeg",
    license: "Public domain",
  },
  {
    file: "steppe-r.webp",
    title: { zh: "《史集》：毡帐前煮食的蒙古人", en: "Jami' al-tawarikh: Mongols cooking by their tents" },
    made: { zh: "赫拉特，约 1430 年", en: "Herat, c. 1430" },
    held: { zh: "法国国家图书馆，Supplément persan 1113", en: "Bibliothèque nationale de France, Supplément persan 1113" },
    page: "https://commons.wikimedia.org/wiki/File:Mongols_cooking_Persian_miniature_taken_from_Jami_al-tawarikh_(Jami_al_tawarikh)_or_Universal_History_by_historian_Rashid_al-din_(al_din)_(1247-1318)_Around_1430._Paris,_B.N_(miniature).jpg",
    original: "https://upload.wikimedia.org/wikipedia/commons/f/f1/Mongols_cooking_Persian_miniature_taken_from_Jami_al-tawarikh_%28Jami_al_tawarikh%29_or_Universal_History_by_historian_Rashid_al-din_%28al_din%29_%281247-1318%29_Around_1430._Paris%2C_B.N_%28miniature%29.jpg",
    license: "Public domain",
  },
  {
    file: "india-l.webp",
    title: { zh: "《迦罗迦传》：伽陀毗罗与塞种王之战", en: "Kalakacharya-katha: Gardabhilla's battle with the Shaka king" },
    made: { zh: "西印度（古吉拉特），15 世纪（可能晚于 1453 年）", en: "Western India (Gujarat), 15th century (possibly after 1453)" },
    held: { zh: "", en: "" },
    page: "https://commons.wikimedia.org/wiki/File:The_Battle_between_Gardbhilla_and_sahi_chief.jpg",
    original: "https://upload.wikimedia.org/wikipedia/commons/4/44/The_Battle_between_Gardbhilla_and_sahi_chief.jpg",
    license: "Public domain",
  },
  {
    file: "india-r.webp",
    title: { zh: "《迦罗迦传》：被俘的伽陀毗罗被带到迦罗迦面前", en: "Kalakacharya-katha: the captive Gardabhilla brought before Kalaka" },
    made: { zh: "西印度，约 1375 年；摄影 Ismoon", en: "Western India, c. 1375; photograph by Ismoon" },
    held: { zh: "孟买，贾特拉帕蒂·希瓦吉博物馆（原威尔士亲王博物馆）", en: "Chhatrapati Shivaji Maharaj Vastu Sangrahalaya (formerly Prince of Wales Museum), Mumbai" },
    page: "https://commons.wikimedia.org/wiki/File:Captive_Gardabhilla._Kalpasutra._C.1375,_Western_India.JPG",
    original: "https://upload.wikimedia.org/wikipedia/commons/7/72/Captive_Gardabhilla._Kalpasutra._C.1375%2C_Western_India.JPG",
    license: "CC0",
  },
  {
    file: "china-l.webp",
    title: { zh: "赵孟頫《浴马图》（局部）", en: "Zhao Mengfu, Bathing Horses (detail)" },
    made: { zh: "赵孟頫（1254–1322）", en: "Zhao Mengfu (1254–1322)" },
    held: { zh: "北京故宫博物院", en: "Palace Museum, Beijing" },
    page: "https://commons.wikimedia.org/wiki/File:9_Zhao_Mengfu._Bathing_Horses._28.1_x_155.5_cm_Detail_of_the_scroll._Palace_Museum,_Beijing.jpg",
    original: "https://upload.wikimedia.org/wikipedia/commons/0/0f/9_Zhao_Mengfu._Bathing_Horses._28.1_x_155.5_cm_Detail_of_the_scroll._Palace_Museum%2C_Beijing.jpg",
    license: "Public domain",
  },
  {
    file: "china-r.webp",
    title: { zh: "刘贯道《元世祖出猎图》", en: "Liu Guandao, Khubilai Khan Hunting" },
    made: { zh: "刘贯道，1280 年", en: "Liu Guandao, 1280" },
    held: { zh: "台北故宫博物院", en: "National Palace Museum, Taipei" },
    page: "https://commons.wikimedia.org/wiki/File:KhubilaiOnTheHunt.jpg",
    original: "https://upload.wikimedia.org/wikipedia/commons/c/cc/KhubilaiOnTheHunt.jpg",
    license: "Public domain",
  },
  {
    file: "japan-l.webp",
    title: { zh: "《蒙古袭来绘词》：竹崎季长（局部）", en: "Mōko Shūrai Ekotoba: Takezaki Suenaga (detail)" },
    made: { zh: "原本约 1293 年；此图据国立国会图书馆藏本，可能为后世摹本", en: "Original c. 1293; this image is from the National Diet Library copy, possibly a later copy" },
    held: { zh: "日本国立国会图书馆", en: "National Diet Library, Japan" },
    page: "https://commons.wikimedia.org/wiki/File:Samurai_Takezaki_Suenaga_detail_M%C5%8Dko_Sh%C5%ABrai_Ekotoba.jpg",
    original: "https://upload.wikimedia.org/wikipedia/commons/e/e9/Samurai_Takezaki_Suenaga_detail_M%C5%8Dko_Sh%C5%ABrai_Ekotoba.jpg",
    license: "Public domain",
  },
  {
    file: "japan-r.webp",
    title: { zh: "《平治物语绘卷》：武士", en: "Heiji Monogatari Emaki: warriors" },
    made: { zh: "日本，13 世纪末", en: "Japan, late 13th century" },
    held: { zh: "", en: "" },
    page: "https://commons.wikimedia.org/wiki/File:Heiji_Monogatari_Emaki_-_Warriors.jpg",
    original: "https://upload.wikimedia.org/wikipedia/commons/9/91/Heiji_Monogatari_Emaki_-_Warriors.jpg",
    license: "Public domain",
  },
];

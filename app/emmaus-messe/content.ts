const photo = (folder: string, image: string) =>
  `https://api.emmaus.wien/files/folder_${folder}/full/img_${image}.jpg`;

const pdf = (record: string, file: string) =>
  `https://db.emmaus.wien/api/files/content_assets/${record}/${file}.pdf`;

export const PHOTOS = {
  congregation: photo("69d39322a83675.04245879", "69d39323efe398.94705927"),
  church: photo("69d39322a83675.04245879", "69d39324997846.46313450"),
};

export const SONGS = [
  {
    title: "An diesem Tag",
    pdf: pdf("5ioof6tsq0jy0do", "an_diesem_tag_uid_64fc9955d4cb9_fzxc0ac6ul"),
  },
  {
    title: "Herr, erbarme dich",
    pdf: pdf(
      "59uz1u2j3s6t88d",
      "herr_erbarme_dich_uid_64fc9957713a2_n715ripiek",
    ),
  },
  {
    title: "Ehre sei Gott",
    pdf: pdf("59ik5j8hyrpl1eq", "ehre_sei_gott_uid_64fc995622ab8_74xx1vcgnw"),
  },
  {
    title: "Schön ist die Welt",
    pdf: pdf(
      "w7goln9gi240ts8",
      "schn_ist_die_welt_uid_64fc9958883f9_mp1e3017ex",
    ),
  },
  {
    title: "Zu dir spricht die Stimme des Herrn",
    pdf: pdf(
      "fybcrwt07y15yc6",
      "zu_dir_spricht_die_stimme_des_herrn_uid_64fc9958c02cd_pvllk26inq",
    ),
  },
  {
    title: "Halleluja",
    pdf: pdf("896ddzid41f2o7q", "halleluja_uid_64fc9956ec43d_gl0dyt0a54"),
  },
  {
    title: "Nimm uns an, verwandle uns",
    pdf: pdf(
      "u0hw0ur3ep3g4x2",
      "nimm_uns_an_verwandle_uns_uid_64fc9958520ee_y8lpp69q8v",
    ),
  },
  {
    title: "Heilig: Wir stehn auf heiligem Grund",
    pdf: pdf(
      "r2cznxmhscpkmkw",
      "heilig_wir_stehn_auf_heiligem_grund_uid_64fc9957359d2_eg6ekvunyo",
    ),
  },
  {
    title: "Lamm Gottes",
    pdf: pdf("zq1gkpa2vpv9spk", "lamm_gottes_uid_64fc9957f0dbb_1g4ry8lw1v"),
  },
  {
    title: "Emmaus-Lied",
    pdf: pdf("ifdxu9ac80en0c4", "emmaus_lied_uid_64fc9956ad67c_i4dfnai4a9"),
  },
  {
    title: "In unserer Mitte",
    pdf: pdf(
      "7i86tx3ddvpevnb",
      "in_unserer_mitte_original_uid_6511e0ff78285_eyzxmifgvd",
    ),
  },
];

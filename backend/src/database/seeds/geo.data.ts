/** Bangladesh: 8 divisions, 64 districts. [name, nameBN] */
export const GEO: {
  name: string;
  nameBN: string;
  districts: [string, string][];
}[] = [
  {
    name: 'Dhaka',
    nameBN: 'ঢাকা',
    districts: [
      ['Dhaka', 'ঢাকা'],
      ['Gazipur', 'গাজীপুর'],
      ['Kishoreganj', 'কিশোরগঞ্জ'],
      ['Manikganj', 'মানিকগঞ্জ'],
      ['Munshiganj', 'মুন্সীগঞ্জ'],
      ['Narayanganj', 'নারায়ণগঞ্জ'],
      ['Narsingdi', 'নরসিংদী'],
      ['Tangail', 'টাঙ্গাইল'],
      ['Faridpur', 'ফরিদপুর'],
      ['Gopalganj', 'গোপালগঞ্জ'],
      ['Madaripur', 'মাদারীপুর'],
      ['Rajbari', 'রাজবাড়ী'],
      ['Shariatpur', 'শরীয়তপুর'],
    ],
  },
  {
    name: 'Chattogram',
    nameBN: 'চট্টগ্রাম',
    districts: [
      ['Chattogram', 'চট্টগ্রাম'],
      ["Cox's Bazar", 'কক্সবাজার'],
      ['Cumilla', 'কুমিল্লা'],
      ['Feni', 'ফেনী'],
      ['Brahmanbaria', 'ব্রাহ্মণবাড়িয়া'],
      ['Rangamati', 'রাঙ্গামাটি'],
      ['Noakhali', 'নোয়াখালী'],
      ['Chandpur', 'চাঁদপুর'],
      ['Lakshmipur', 'লক্ষ্মীপুর'],
      ['Khagrachhari', 'খাগড়াছড়ি'],
      ['Bandarban', 'বান্দরবান'],
    ],
  },
  {
    name: 'Rajshahi',
    nameBN: 'রাজশাহী',
    districts: [
      ['Rajshahi', 'রাজশাহী'],
      ['Bogura', 'বগুড়া'],
      ['Joypurhat', 'জয়পুরহাট'],
      ['Naogaon', 'নওগাঁ'],
      ['Natore', 'নাটোর'],
      ['Chapainawabganj', 'চাঁপাইনবাবগঞ্জ'],
      ['Pabna', 'পাবনা'],
      ['Sirajganj', 'সিরাজগঞ্জ'],
    ],
  },
  {
    name: 'Khulna',
    nameBN: 'খুলনা',
    districts: [
      ['Khulna', 'খুলনা'],
      ['Bagerhat', 'বাগেরহাট'],
      ['Chuadanga', 'চুয়াডাঙ্গা'],
      ['Jashore', 'যশোর'],
      ['Jhenaidah', 'ঝিনাইদহ'],
      ['Kushtia', 'কুষ্টিয়া'],
      ['Magura', 'মাগুরা'],
      ['Meherpur', 'মেহেরপুর'],
      ['Narail', 'নড়াইল'],
      ['Satkhira', 'সাতক্ষীরা'],
    ],
  },
  {
    name: 'Barishal',
    nameBN: 'বরিশাল',
    districts: [
      ['Barishal', 'বরিশাল'],
      ['Barguna', 'বরগুনা'],
      ['Bhola', 'ভোলা'],
      ['Jhalokati', 'ঝালকাঠি'],
      ['Patuakhali', 'পটুয়াখালী'],
      ['Pirojpur', 'পিরোজপুর'],
    ],
  },
  {
    name: 'Sylhet',
    nameBN: 'সিলেট',
    districts: [
      ['Sylhet', 'সিলেট'],
      ['Habiganj', 'হবিগঞ্জ'],
      ['Moulvibazar', 'মৌলভীবাজার'],
      ['Sunamganj', 'সুনামগঞ্জ'],
    ],
  },
  {
    name: 'Rangpur',
    nameBN: 'রংপুর',
    districts: [
      ['Rangpur', 'রংপুর'],
      ['Dinajpur', 'দিনাজপুর'],
      ['Gaibandha', 'গাইবান্ধা'],
      ['Kurigram', 'কুড়িগ্রাম'],
      ['Lalmonirhat', 'লালমনিরহাট'],
      ['Nilphamari', 'নীলফামারী'],
      ['Panchagarh', 'পঞ্চগড়'],
      ['Thakurgaon', 'ঠাকুরগাঁও'],
    ],
  },
  {
    name: 'Mymensingh',
    nameBN: 'ময়মনসিংহ',
    districts: [
      ['Mymensingh', 'ময়মনসিংহ'],
      ['Jamalpur', 'জামালপুর'],
      ['Netrokona', 'নেত্রকোণা'],
      ['Sherpur', 'শেরপুর'],
    ],
  },
];

/** [value, name, nameBN, prescriptionType] */
export const SPECIALITIES: [
  string,
  string,
  string,
  'GENERAL' | 'NUTRITIONIST' | 'OTHER',
][] = [
  ['general-physician', 'General Physician', 'জেনারেল ফিজিশিয়ান', 'GENERAL'],
  ['medicine', 'Medicine', 'মেডিসিন', 'GENERAL'],
  ['cardiology', 'Cardiology', 'হৃদরোগ', 'GENERAL'],
  ['gynecology', 'Gynecology & Obstetrics', 'গাইনি ও প্রসূতি', 'GENERAL'],
  ['pediatrics', 'Pediatrics', 'শিশু রোগ', 'GENERAL'],
  ['dermatology', 'Dermatology', 'চর্ম রোগ', 'GENERAL'],
  ['orthopedics', 'Orthopedics', 'অর্থোপেডিক্স', 'GENERAL'],
  ['ent', 'ENT', 'নাক কান গলা', 'GENERAL'],
  ['eye', 'Ophthalmology', 'চক্ষু রোগ', 'GENERAL'],
  ['neurology', 'Neurology', 'স্নায়ু রোগ', 'GENERAL'],
  ['psychiatry', 'Psychiatry', 'মানসিক রোগ', 'GENERAL'],
  ['nutrition', 'Nutrition', 'পুষ্টি', 'NUTRITIONIST'],
];

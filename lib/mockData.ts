export type Axis = 'A' | 'B';
export type AxisAStage = 'Cold' | 'Contacted' | 'Responded' | 'Demo' | 'Proposal' | 'Won';
export type AxisBStage = 'Cold' | 'Contacted' | 'NDA Signed' | 'Term Sheet' | 'Contracted' | 'Active';

export interface Prospect {
  id: string;
  company: string;
  country: string;
  flag: string;
  contact: string;
  email: string;
  linkedin_url?: string;
  axis: Axis;
  stage: AxisAStage | AxisBStage;
  score: number;
  segment: string;
  lastContacted: string;
  notes: string;
}

export const prospects: Prospect[] = [
  { id: '1',  company: 'Coachella / Goldenvoice',  country: 'USA',       flag: '🇺🇸', contact: 'Alex Rivera',      email: 'arivera@goldenvoice.com',         linkedin_url: 'https://www.linkedin.com/in/alex-rivera-goldenvoice',    axis: 'A', stage: 'Demo',        score: 92, segment: 'Music Festival',      lastContacted: '2026-06-20', notes: 'Very interested in VIP activation zones' },
  { id: '2',  company: 'Live Nation Entertainment', country: 'USA',       flag: '🇺🇸', contact: 'Sarah Chen',        email: 's.chen@livenation.com',           linkedin_url: 'https://www.linkedin.com/in/sarah-chen-livenation',      axis: 'A', stage: 'Proposal',    score: 88, segment: 'Event Promoter',      lastContacted: '2026-06-22', notes: 'Proposal for 50,000 units across 20 venues' },
  { id: '3',  company: 'Fuji Rock Festival',        country: 'Japan',     flag: '🇯🇵', contact: 'Tanaka Hiroshi',   email: 'h.tanaka@smash-jpn.com',          axis: 'A', stage: 'Responded',   score: 75, segment: 'Music Festival',      lastContacted: '2026-06-18', notes: 'Requested product samples' },
  { id: '4',  company: 'Glastonbury Festival',      country: 'UK',        flag: '🇬🇧', contact: 'Emily Eavis',      email: 'emily@glastonburyfestivals.co.uk', linkedin_url: 'https://www.linkedin.com/in/emily-eavis',               axis: 'A', stage: 'Contacted',   score: 85, segment: 'Music Festival',      lastContacted: '2026-06-15', notes: 'No reply yet, follow up due' },
  { id: '5',  company: 'AEG Presents',              country: 'USA',       flag: '🇺🇸', contact: 'Michael Rapino',   email: 'm.rapino@aegpresents.com',        linkedin_url: 'https://www.linkedin.com/in/michael-rapino',            axis: 'A', stage: 'Won',         score: 95, segment: 'Event Promoter',      lastContacted: '2026-06-10', notes: 'PO received: 20,000 units 🎉' },
  { id: '6',  company: 'Summer Sonic',              country: 'Japan',     flag: '🇯🇵', contact: 'Yuki Yamamoto',    email: 'y.yamamoto@creativeman.co.jp',    axis: 'A', stage: 'Cold',        score: 68, segment: 'Music Festival',      lastContacted: '',           notes: '' },
  { id: '7',  company: 'Ultra Music Festival',      country: 'USA',       flag: '🇺🇸', contact: 'Russell Faibisch', email: 'rf@ultra.com',                    linkedin_url: 'https://www.linkedin.com/in/russell-faibisch',          axis: 'A', stage: 'Demo',        score: 80, segment: 'Music Festival',      lastContacted: '2026-06-21', notes: 'Demo scheduled for next week' },
  { id: '8',  company: 'Ministry of Sound',         country: 'UK',        flag: '🇬🇧', contact: 'James Palumbo',    email: 'j.palumbo@mos.com',               linkedin_url: 'https://www.linkedin.com/in/james-palumbo-mos',         axis: 'A', stage: 'Responded',   score: 72, segment: 'Nightclub',           lastContacted: '2026-06-19', notes: 'Interested in monthly recurring order' },
  { id: '9',  company: 'Lollapalooza',              country: 'USA',       flag: '🇺🇸', contact: 'Perry Farrell',    email: 'p.farrell@lollapalooza.com',      axis: 'A', stage: 'Contacted',   score: 78, segment: 'Music Festival',      lastContacted: '2026-06-16', notes: '' },
  { id: '10', company: 'Good Food & Wine Show',     country: 'Australia', flag: '🇦🇺', contact: 'Kate Morrison',    email: 'k.morrison@goodfoodwine.com.au',  axis: 'A', stage: 'Cold',        score: 60, segment: 'Food & Beverage',     lastContacted: '',           notes: '' },
  { id: '11', company: 'Beam Suntory Asia',         country: 'Japan',     flag: '🇯🇵', contact: 'Kenji Watanabe',   email: 'k.watanabe@beamsuntory.com',      linkedin_url: 'https://www.linkedin.com/in/kenji-watanabe-beamsuntory', axis: 'B', stage: 'NDA Signed',  score: 90, segment: 'Spirits Distributor', lastContacted: '2026-06-21', notes: 'NDA executed, reviewing term sheet' },
  { id: '12', company: 'William Grant & Sons',      country: 'UK',        flag: '🇬🇧', contact: 'Glenn Gordon',      email: 'g.gordon@wmgrant.com',            linkedin_url: 'https://www.linkedin.com/in/glenn-gordon-wgrants',       axis: 'B', stage: 'Term Sheet',  score: 85, segment: 'Spirits Distributor', lastContacted: '2026-06-23', notes: 'Negotiating exclusivity for UK & Ireland' },
  { id: '13', company: 'Heinemann Duty Free',       country: 'Singapore', flag: '🇸🇬', contact: 'Andreas Schulz',   email: 'a.schulz@heinemann.com',          linkedin_url: 'https://www.linkedin.com/in/andreas-schulz-heinemann',  axis: 'B', stage: 'Contacted',   score: 70, segment: 'Travel Retail',       lastContacted: '2026-06-17', notes: 'APAC duty-free opportunity' },
  { id: '14', company: 'Diageo On-Trade Asia',      country: 'Singapore', flag: '🇸🇬', contact: 'Priya Patel',      email: 'p.patel@diageo.com',              linkedin_url: 'https://www.linkedin.com/in/priya-patel-diageo',        axis: 'B', stage: 'Active',      score: 98, segment: 'Spirits Distributor', lastContacted: '2026-06-24', notes: 'Contract signed — SE Asia non-exclusive' },
  { id: '15', company: 'Thai Beverage Alliance',    country: 'Thailand',  flag: '🇹🇭', contact: 'Somchai Lertsuk',  email: 's.lertsuk@tba.co.th',            axis: 'B', stage: 'Cold',        score: 55, segment: 'Beverage Distributor',lastContacted: '',           notes: '' },
];

export type ContentType = 'video' | 'pdf' | 'image' | 'gif';
export type ContentCategory = 'Product Demo' | 'Business Pitch' | 'Viral' | 'Social Proof';

export interface ContentAsset {
  id: string;
  title: string;
  type: ContentType;
  category: ContentCategory;
  tags: string[];
  markets: string[];
  createdBy: string;
  uploadedAt: string;
  thumbnail: string;
}

export const contentAssets: ContentAsset[] = [];

export const AXIS_A_STAGES: AxisAStage[] = ['Cold', 'Contacted', 'Responded', 'Demo', 'Proposal', 'Won'];
export const AXIS_B_STAGES: AxisBStage[] = ['Cold', 'Contacted', 'NDA Signed', 'Term Sheet', 'Contracted', 'Active'];

export const recentActivity = [
  { id: 'a1', type: 'reply', message: 'William Grant & Sons replied to outreach email',         time: '2h ago',  axis: 'B' as Axis },
  { id: 'a2', type: 'deal',  message: 'Coachella / Goldenvoice moved to Demo stage',             time: '5h ago',  axis: 'A' as Axis },
  { id: 'a3', type: 'doc',   message: 'NDA signed by Beam Suntory Asia',                        time: '1d ago',  axis: 'B' as Axis },
  { id: 'a4', type: 'win',   message: 'AEG Presents — PO received: 20,000 units 🎉',            time: '2d ago',  axis: 'A' as Axis },
  { id: 'a5', type: 'reply', message: 'Ministry of Sound replied — interested in monthly order', time: '3d ago',  axis: 'A' as Axis },
];

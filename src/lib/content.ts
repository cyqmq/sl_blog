import { getCollection } from 'astro:content';

export type NavLink = { name: string; url: string; desc?: string; icon?: string };
export type NavCategory = { title: string; icon?: string; links: NavLink[] };
export type Social = { name: string; href: string; icon?: string };
export type Profile = {
  name: string;
  handle?: string;
  role?: string;
  bio: string[];
  avatar?: string;
  email?: string;
  website?: string;
};

export async function getNav(): Promise<NavCategory[]> {
  const c = await getCollection('nav');
  return (c[0]?.data ?? []) as NavCategory[];
}

export async function getAbout(): Promise<{ profile: Profile; socials: Social[] }> {
  const c = await getCollection('about');
  const d = c[0]?.data as
    | {
        name: string;
        handle?: string;
        role?: string;
        bio?: string[];
        avatar?: string;
        email?: string;
        website?: string;
        socials?: Social[];
      }
    | undefined;
  if (!d) return { profile: { name: 'cyqmq', bio: [] }, socials: [] };
  return {
    profile: {
      name: d.name,
      handle: d.handle,
      role: d.role,
      bio: d.bio ?? [],
      avatar: d.avatar,
      email: d.email,
      website: d.website,
    },
    socials: d.socials ?? [],
  };
}

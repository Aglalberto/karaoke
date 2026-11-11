import data from '../data/songs.json';
import { thumbFor, type Video } from './types';

export interface Song {
  id: string;
  artist: string;
  title: string;
  videoId: string | null;
}

export interface SongList {
  id: string;
  title: string;
  songs: Song[];
}

interface RawData {
  songs: Record<string, { artist: string; title: string; videoId: string | null }>;
  lists: Array<{ id: string; title: string; songs: string[] }>;
}

const raw = data as RawData;

export const songLists: SongList[] = raw.lists.map((list) => ({
  id: list.id,
  title: list.title,
  songs: list.songs
    .map((id) => (raw.songs[id] ? { id, ...raw.songs[id] } : null))
    .filter((song): song is Song => song !== null),
}));

export const getList = (id: string) => songLists.find((list) => list.id === id);

export const songToVideo = (song: Song): Video | null =>
  song.videoId
    ? { videoId: song.videoId, title: song.title, channel: song.artist, thumb: thumbFor(song.videoId) }
    : null;

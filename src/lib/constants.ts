import type { Difficulty } from '@/types';

export interface ElementMeta {
  name: string;
  emoji: string;
  color: string;
  glow: string;
  bg: string;
  text: string;
  ring: string;
  border: string;
  shadow: string;
  topic: string;
}

export const ELEMENTS: Record<string, ElementMeta> = {
  Fire:      { name: 'Fire',      emoji: '🔥', color: '#F08030', glow: '#F87171', bg: 'bg-orange-500/15',  text: 'text-orange-300',  ring: 'ring-orange-500/50',  border: 'border-orange-500/40',  shadow: 'shadow-orange-500/30',  topic: 'Dynamic Programming' },
  Water:     { name: 'Water',     emoji: '💧', color: '#6890F0', glow: '#60A5FA', bg: 'bg-blue-500/15',    text: 'text-blue-300',    ring: 'ring-blue-500/50',    border: 'border-blue-500/40',    shadow: 'shadow-blue-500/30',    topic: 'Queues & Flow' },
  Grass:     { name: 'Grass',      emoji: '🌿', color: '#78C850', glow: '#4ADE80', bg: 'bg-green-500/15',   text: 'text-green-300',   ring: 'ring-green-500/50',   border: 'border-green-500/40',   shadow: 'shadow-green-500/30',   topic: 'Trees & Graphs' },
  Electric:  { name: 'Electric',   emoji: '⚡', color: '#F8D030', glow: '#FACC15', bg: 'bg-yellow-500/15',  text: 'text-yellow-300',  ring: 'ring-yellow-500/50',  border: 'border-yellow-500/40',  shadow: 'shadow-yellow-500/30',  topic: 'Bitwise' },
  Psychic:   { name: 'Psychic',    emoji: '🔮', color: '#F85888', glow: '#E879F9', bg: 'bg-fuchsia-500/15', text: 'text-fuchsia-300', ring: 'ring-fuchsia-500/50', border: 'border-fuchsia-500/40', shadow: 'shadow-fuchsia-500/30', topic: 'Math & Number Theory' },
  Ice:       { name: 'Ice',        emoji: '❄️', color: '#98D8D8', glow: '#22D3EE', bg: 'bg-cyan-500/15',    text: 'text-cyan-300',    ring: 'ring-cyan-500/50',    border: 'border-cyan-500/40',   shadow: 'shadow-cyan-500/30',   topic: 'Sliding Window' },
  Dragon:    { name: 'Dragon',     emoji: '🐉', color: '#7038F8', glow: '#A78BFA', bg: 'bg-violet-500/15',  text: 'text-violet-300',  ring: 'ring-violet-500/50',  border: 'border-violet-500/40',  shadow: 'shadow-violet-500/30',  topic: 'Hard Algorithms' },
  Dark:      { name: 'Dark',       emoji: '🌙', color: '#705848', glow: '#A8A29E', bg: 'bg-stone-500/15',   text: 'text-stone-300',   ring: 'ring-stone-500/50',   border: 'border-stone-500/40',   shadow: 'shadow-stone-500/30',   topic: 'Backtracking' },
  Fairy:     { name: 'Fairy',      emoji: '✨', color: '#EE99AC', glow: '#F9A8D4', bg: 'bg-pink-500/15',    text: 'text-pink-300',    ring: 'ring-pink-500/50',    border: 'border-pink-500/40',   shadow: 'shadow-pink-500/30',   topic: 'Strings' },
  Steel:     { name: 'Steel',      emoji: '🛡️', color: '#B8B8D0', glow: '#94A3B8', bg: 'bg-slate-500/15',   text: 'text-slate-300',   ring: 'ring-slate-500/50',   border: 'border-slate-500/40',   shadow: 'shadow-slate-500/30',   topic: 'Greedy' },
  Ghost:     { name: 'Ghost',      emoji: '👻', color: '#705898', glow: '#C4B5FD', bg: 'bg-indigo-500/15',  text: 'text-indigo-300',  ring: 'ring-indigo-500/50',  border: 'border-indigo-500/40',  shadow: 'shadow-indigo-500/30',  topic: 'Recursion' },
  Ground:    { name: 'Ground',     emoji: '🏜️', color: '#E0C068', glow: '#D6A86A', bg: 'bg-amber-500/15',   text: 'text-amber-300',  ring: 'ring-amber-500/50',   border: 'border-amber-500/40',   shadow: 'shadow-amber-500/30',   topic: 'Segment Trees' },
  Flying:    { name: 'Flying',     emoji: '🕊️', color: '#A890F0', glow: '#A5B4FC', bg: 'bg-indigo-400/15',  text: 'text-indigo-200', ring: 'ring-indigo-400/50',  border: 'border-indigo-400/40',  shadow: 'shadow-indigo-400/30',  topic: 'Sorting & Searching' },
  Bug:       { name: 'Bug',        emoji: '🐛', color: '#A8B820', glow: '#BEF264', bg: 'bg-lime-500/15',    text: 'text-lime-300',    ring: 'ring-lime-500/50',    border: 'border-lime-500/40',   shadow: 'shadow-lime-500/30',   topic: 'Simulation' },
  Poison:    { name: 'Poison',     emoji: '🧪', color: '#A040A0', glow: '#C084FC', bg: 'bg-purple-500/15',  text: 'text-purple-300',  ring: 'ring-purple-500/50',  border: 'border-purple-500/40',  shadow: 'shadow-purple-500/30',  topic: 'Edge Cases' },
  Rock:      { name: 'Rock',       emoji: '🪨', color: '#B89F38', glow: '#D4AF37', bg: 'bg-yellow-700/15',  text: 'text-yellow-200',  ring: 'ring-yellow-700/50',  border: 'border-yellow-700/40',  shadow: 'shadow-yellow-700/30',  topic: 'Divide & Conquer' },
  Fighting:  { name: 'Fighting',   emoji: '🥊', color: '#C03028', glow: '#F87171', bg: 'bg-red-700/15',     text: 'text-red-300',    ring: 'ring-red-700/50',    border: 'border-red-700/40',    shadow: 'shadow-red-700/30',    topic: 'Brute Force' },
  Normal:    { name: 'Normal',     emoji: '⚪', color: '#A8A878', glow: '#D6D3D1', bg: 'bg-stone-400/15',   text: 'text-stone-300',  ring: 'ring-stone-400/50',   border: 'border-stone-400/40',   shadow: 'shadow-stone-400/30',   topic: 'Basic Arrays' },
};

export const ELEMENT_LIST = Object.keys(ELEMENTS);

export const DIFFICULTIES: Record<Difficulty, DifficultyMeta> = {
  easy:   { name: 'easy',   label: 'Poké Ball Class',   ball: 'pokeball',  color: '#34D399', bg: 'bg-emerald-500/15', text: 'text-emerald-300', border: 'border-emerald-500/40' },
  medium: { name: 'medium', label: 'Great Ball Class',  ball: 'greatball', color: '#3B82F6', bg: 'bg-blue-500/15',    text: 'text-blue-300',    border: 'border-blue-500/40' },
  hard:   { name: 'hard',   label: 'Ultra Ball Class',  ball: 'ultraball', color: '#A855F7', bg: 'bg-violet-500/15',  text: 'text-violet-300',  border: 'border-violet-500/40' },
  expert: { name: 'expert', label: 'Master Ball Class', ball: 'masterball',color: '#FACC15', bg: 'bg-yellow-500/15',  text: 'text-yellow-300',  border: 'border-yellow-500/40' },
};

export interface DifficultyMeta {
  name: Difficulty;
  label: string;
  ball: string;
  color: string;
  bg: string;
  text: string;
  border: string;
}

export interface LanguageMeta {
  id: string;
  label: string;
  piston: string;
  pistonVersion: string;
  wandbox: string;
  boilerplate: string;
  monaco: string;
}

export const LANGUAGES: LanguageMeta[] = [
  {
    id: 'cpp',
    label: 'C++ 17',
    piston: 'c++',
    pistonVersion: '10.2.0',
    wandbox: 'gcc-head',
    monaco: 'cpp',
    boilerplate: `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;
    cout << n << "\\n";
    return 0;
}
`,
  },
  {
    id: 'python3',
    label: 'Python 3',
    piston: 'python',
    pistonVersion: '3.10.0',
    wandbox: 'cpython-3.10.2',
    monaco: 'python',
    boilerplate: `import sys
input = sys.stdin.readline

def main():
    n = int(input())
    print(n)

if __name__ == "__main__":
    main()
`,
  },
  {
    id: 'java',
    label: 'Java 17',
    piston: 'java',
    pistonVersion: '15.0.2',
    wandbox: 'openjdk-15.0.2',
    monaco: 'java',
    boilerplate: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        System.out.println(n);
    }
}
`,
  },
  {
    id: 'javascript',
    label: 'JavaScript',
    piston: 'javascript',
    pistonVersion: '1.32.0',
    wandbox: 'nodejs-head',
    monaco: 'javascript',
    boilerplate: `const main = () => {
  const input = require('fs').readFileSync(0, 'utf8');
  const n = parseInt(input.trim(), 10);
  console.log(n);
};
main();
`,
  },
  {
    id: 'go',
    label: 'Go',
    piston: 'go',
    pistonVersion: '1.16.2',
    wandbox: 'go-1.16.2',
    monaco: 'go',
    boilerplate: `package main

import "fmt"

func main() {
    var n int
    fmt.Scan(&n)
    fmt.Println(n)
}
`,
  },
];

export function languageById(id: string): LanguageMeta {
  return LANGUAGES.find((l) => l.id === id) ?? LANGUAGES[0];
}

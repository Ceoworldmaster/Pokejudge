import type { Difficulty } from '@/types';

export interface ElementMeta {
  name: string;
  color: string;
  bg: string;
  text: string;
  ring: string;
  topic: string;
}

export const ELEMENTS: Record<string, ElementMeta> = {
  Normal:   { name: 'Normal',   color: '#A8A878', bg: 'bg-stone-500/15',  text: 'text-stone-300',   ring: 'ring-stone-500/40',   topic: 'Arrays & Strings' },
  Fire:     { name: 'Fire',     color: '#F08030', bg: 'bg-orange-500/15', text: 'text-orange-300',  ring: 'ring-orange-500/40',  topic: 'Greedy & Searching' },
  Water:    { name: 'Water',    color: '#6890F0', bg: 'bg-blue-500/15',   text: 'text-blue-300',   ring: 'ring-blue-500/40',    topic: 'Two Pointers & Sliding Window' },
  Grass:    { name: 'Grass',    color: '#78C850', bg: 'bg-green-500/15',  text: 'text-green-300',  ring: 'ring-green-500/40',   topic: 'Trees & Graphs' },
  Electric: { name: 'Electric', color: '#F8D030', bg: 'bg-yellow-500/15', text: 'text-yellow-300', ring: 'ring-yellow-500/40',  topic: 'Bit Manipulation & Fast I/O' },
  Psychic:  { name: 'Psychic',  color: '#F85888', bg: 'bg-pink-500/15',  text: 'text-pink-300',   ring: 'ring-pink-500/40',    topic: 'Dynamic Programming & Math' },
  Ice:      { name: 'Ice',      color: '#98D8D8', bg: 'bg-cyan-500/15',  text: 'text-cyan-300',   ring: 'ring-cyan-500/40',    topic: 'Constructive & Ad-hoc' },
  Dragon:   { name: 'Dragon',   color: '#7038F8', bg: 'bg-violet-500/15',text: 'text-violet-300', ring: 'ring-violet-500/40',  topic: 'Advanced Data Structures' },
};

export const ELEMENT_LIST = Object.keys(ELEMENTS);

export interface DifficultyMeta {
  name: Difficulty;
  label: string;
  ball: string;
  color: string;
  bg: string;
  text: string;
  border: string;
}

export const DIFFICULTIES: Record<Difficulty, DifficultyMeta> = {
  easy:   { name: 'easy',   label: 'Poké Ball Class',   ball: 'pokeball',  color: '#34D399', bg: 'bg-emerald-500/15', text: 'text-emerald-300', border: 'border-emerald-500/40' },
  medium: { name: 'medium', label: 'Great Ball Class',  ball: 'greatball', color: '#3B82F6', bg: 'bg-blue-500/15',    text: 'text-blue-300',    border: 'border-blue-500/40' },
  hard:   { name: 'hard',   label: 'Ultra Ball Class',  ball: 'ultraball', color: '#A855F7', bg: 'bg-violet-500/15',  text: 'text-violet-300',  border: 'border-violet-500/40' },
  expert: { name: 'expert', label: 'Master Ball Class',  ball: 'masterball',color: '#FACC15', bg: 'bg-yellow-500/15',  text: 'text-yellow-300',  border: 'border-yellow-500/40' },
};

export interface LanguageMeta {
  id: string;
  label: string;
  piston: string;
  pistonVersion: string;
  boilerplate: string;
  monaco: string;
}

export const LANGUAGES: LanguageMeta[] = [
  {
    id: 'cpp',
    label: 'C++ 17',
    piston: 'c++',
    pistonVersion: '10.2.0',
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

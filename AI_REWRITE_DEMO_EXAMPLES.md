# K1ND.world Source-Backed Rewrite Demo Examples

Build: **v4.20.0** (V4.19 semantic rewrite engine retained)

The V4.20.0 build retains the V4.19 semantic rewrite: it is not a generic politeness message—and it is not invoked merely because a swear word appears. The engine separates the post into clauses, resolves the target and speech act of each, and tests the function of any profanity. When an actual attack contains a recoverable proposition, K1ND removes the harmful clause, preserves the source's point, re-runs the wording through moderation and separately checks meaning fidelity. If fidelity is not proven, the candidate is withheld.

`Fuck what a great shot` is therefore published as written: it is emphatic praise, not a rewrite case. `Fuck that player` still receives an intervention, and `I will fucking hurt you` remains a hard threat block.

## Best live examples

| Draft | Expected output | Why it is faithful |
|---|---|---|
| `Your first serve kept landing short, you useless clown.` | **Your first serve kept landing short.** | Keeps the exact first-serve criticism. |
| `You moron; your return position was too deep all match.` | **Your return position was too deep all match.** | Keeps the tactical claim and removes only the personal label. |
| `That line call was fucking awful, you idiot.` | **That line call was awful.** | Keeps the negative judgement about the call. |
| `Your tactical point about returning position is fair, you moron.` | **Your tactical point about returning position is fair.** | Keeps the discussion point. |
| `You are a clown. The second serve was too predictable.` | **The second serve was too predictable.** | Removes the person attack and keeps the tennis analysis. |
| `That line call looked fixed because it changed after the challenge.` | **It changed after the challenge. That raised a concern for me, but I cannot verify wrongdoing.** | Preserves the observable basis while qualifying the allegation. |
| `That shot was brilliant; you are an idiot.` | **That shot was brilliant.** | Keeps the praise clause and removes only the person-directed degradation. |
| `Nice job, genius.` | **No rewrite offered.** | The taunt has no independent proposition; inventing praise or criticism would misrepresent the author. |

## Hard-block boundary

A prohibited original always remains blocked. If a separate clean sporting clause can be recovered, it is labelled **Source-backed new draft · original remains blocked** and is independently re-moderated before it can be used.

Example structure:

- Original: `[clean sporting point]. [threat or prohibited hate]`
- Original outcome: **Hard block**
- Separately validated draft: `[clean sporting point].`

A threat-only or slur-only draft receives **no** automatic wording.

## Native boundary-setting rewrites

When the genuine intent is a request for distance, the engine can preserve that intent in the source language. V4.11 adds native responses for Bengali, Persian/Farsi, Hebrew, Indonesian, Malay, Vietnamese, Thai, Tagalog/Filipino, Swahili and Amharic, alongside the existing language packs.

These are deliberately narrow intent maps. They do not translate arbitrary hostile text or invent a sporting opinion.

## Presenter line

“K1ND keeps the author's actual sporting point, shows which words it kept, removes the attack, and checks the result again. If there is no real point, it writes nothing for them.”

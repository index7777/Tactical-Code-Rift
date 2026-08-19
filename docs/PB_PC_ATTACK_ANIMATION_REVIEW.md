# 千景 / 朧 Attack Animation Review

## Diagnosis
The current pose files are usable character renders, but the original runtime treated them like the same generic sword animation:

`step back -> move to target -> one generic slash sprite -> target recoil -> return`

That is why PB/PC did not read like distinct JRPG techniques even though their illustrations were different.

## Runtime fix in this patch

### 千景
- longer anticipation and attack spacing;
- naginata reach line before entry;
- wide polearm crescent at contact;
- slightly slower return to preserve weapon weight;
- clash follow-through receives the same gold/violet sweep language.

### 朧
- shorter anticipation;
- accelerated entry;
- multiple transparent afterimages cloned from the active strike texture;
- crossed cut at impact;
- faster return to standby;
- clash attack receives the same violet cross-cut language.

## Asset limitation that remains
This code pass can create substantially better technique readability, but it cannot invent correct anatomy inside the source PNG. The next art task should therefore replace only the two highest-value source poses:

- 千景: `sweep`
- 朧: `dash-cut`

Do **not** generate a full animation sheet yet. Approve these two key poses in the actual battle scene first.

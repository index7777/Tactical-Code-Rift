# Redleaf production-ready v2

這版已修正固定區域裁切造成的鄰格污染。

流程：
1. 人工指定每個語意 frame 的局部區域。
2. 依 alpha 做 connected-component 分析。
3. Actor / attack frame 只保留該區域最大的主物件，去掉相鄰 frame 飄進來的碎片。
4. Runtime 統一 360×240、bottom-center anchor。
5. Attack 統一 512×320；與角色實際連在一起的斬擊弧保留。
6. FX atlas 的楓葉／火花本來就可能分離，因此 FX 不做 largest-component 過濾。

可直接接現有 PD contract：
idle-a, idle-b, ready, attack-a, attack-b, hit-a, hit-b, down。

"""
Topic 5.6 Capstone: Connecting All 5.6 Skills (AP Stats Unit 5, Topic 5.6)

Complete concept map / flowchart showing the full pipeline for sampling
distributions of the difference of two sample proportions:
  Two populations → Take samples → Compute p̂₁ − p̂₂ → branch to
  (a) Check Conditions, (b) Describe Distribution, (c) Calculate Probability.
Ends with a formula reference box and the key insight:
"Variances ALWAYS add — even for differences!"

Run with: manim -qm --format=mp4 apstat_56_diff_prop_capstone.py DiffPropCapstone
"""
from manim import *
import numpy as np

# Consistent color scheme
BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class DiffPropCapstone(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        # ==================== HELPERS ====================
        def make_box(texts, box_color, pos, width=4.0, min_height=0.6):
            """Rounded rectangle node with centered text lines."""
            content = VGroup()
            for t_str, t_size, t_color, t_weight in texts:
                if t_str.startswith("$") and t_str.endswith("$"):
                    item = MathTex(t_str[1:-1], font_size=t_size, color=t_color)
                else:
                    item = Text(
                        t_str, font_size=t_size, color=t_color,
                        weight=t_weight if t_weight else NORMAL,
                    )
                content.add(item)
            content.arrange(DOWN, buff=0.05)

            content_height = content.get_height()
            box_height = max(min_height, content_height + 0.25)

            box = RoundedRectangle(
                corner_radius=0.12,
                width=width, height=box_height,
                stroke_color=box_color, stroke_width=2.5,
                fill_color=box_color, fill_opacity=0.1,
            )
            box.move_to(pos)
            content.move_to(box.get_center())
            return VGroup(box, content)

        def connect(start_mob, end_mob, color=WHITE, **kwargs):
            """Arrow from bottom of start to top of end."""
            return Arrow(
                start_mob[0].get_bottom(),
                end_mob[0].get_top(),
                color=color, buff=0.06, stroke_width=2,
                max_tip_length_to_length_ratio=0.15,
                **kwargs,
            )

        # ==================== TITLE ====================
        title = Text("Topic 5.6: Complete Roadmap", font_size=36, weight=BOLD)
        title.to_edge(UP, buff=0.25)
        self.play(Write(title), run_time=0.8)
        self.wait(0.3)

        # ==================== ROW 1: Two populations ====================
        pop1 = make_box(
            [("Population 1", 20, BLUE_3B1B, BOLD),
             (r"$(p_1)$", 20, WHITE, None)],
            BLUE_3B1B, LEFT * 2.8 + UP * 2.2, width=3.2,
        )
        pop2 = make_box(
            [("Population 2", 20, PINK_3B1B, BOLD),
             (r"$(p_2)$", 20, WHITE, None)],
            PINK_3B1B, RIGHT * 2.8 + UP * 2.2, width=3.2,
        )
        self.play(
            GrowFromCenter(pop1), GrowFromCenter(pop2),
            run_time=0.7,
        )
        self.wait(0.3)

        # ==================== ROW 2: Take samples ====================
        samples_box = make_box(
            [("Take samples", 22, TEAL_3B1B, BOLD),
             (r"$n_1 , n_2$", 22, WHITE, None)],
            TEAL_3B1B, ORIGIN + UP * 0.95, width=4.0,
        )
        arr_p1_s = connect(pop1, samples_box, WHITE)
        arr_p2_s = connect(pop2, samples_box, WHITE)
        self.play(Create(arr_p1_s), Create(arr_p2_s), run_time=0.4)
        self.play(FadeIn(samples_box), run_time=0.5)
        self.wait(0.3)

        # ==================== ROW 3: Compute difference ====================
        diff_box = make_box(
            [("Compute", 20, YELLOW_3B1B, BOLD),
             (r"$\hat{p}_1 - \hat{p}_2$", 24, WHITE, None)],
            YELLOW_3B1B, ORIGIN + DOWN * 0.25, width=4.0,
        )
        arr_s_d = connect(samples_box, diff_box, WHITE)
        self.play(Create(arr_s_d), run_time=0.3)
        self.play(FadeIn(diff_box), run_time=0.5)
        self.wait(0.4)

        # ==================== ROW 4: Three branches ====================
        # --- Branch A: Check Conditions (left) ---
        cond_box = make_box(
            [("Check Conditions", 18, YELLOW_3B1B, BOLD)],
            YELLOW_3B1B, LEFT * 4.6 + DOWN * 1.6,
            width=3.0, min_height=0.55,
        )

        arr_d_cond = Arrow(
            diff_box[0].get_bottom() + LEFT * 0.5,
            cond_box[0].get_top(),
            color=WHITE, buff=0.06, stroke_width=2,
            max_tip_length_to_length_ratio=0.15,
        )

        # Sub-nodes for conditions
        cond_sub1 = make_box(
            [("10% condition", 16, WHITE, BOLD),
             ("(both samples)", 14, GRAY, None)],
            YELLOW_3B1B, LEFT * 4.6 + DOWN * 2.85, width=3.0, min_height=0.5,
        )
        cond_sub2 = make_box(
            [("Large Counts", 16, WHITE, BOLD),
             ("(all 4 checks)", 14, GRAY, None)],
            YELLOW_3B1B, LEFT * 4.6 + DOWN * 3.85, width=3.0, min_height=0.5,
        )

        # --- Branch B: Describe Distribution (center) ---
        desc_box = make_box(
            [("Describe Distribution", 18, BLUE_3B1B, BOLD)],
            BLUE_3B1B, ORIGIN + DOWN * 1.6, width=3.4, min_height=0.55,
        )
        arr_d_desc = Arrow(
            diff_box[0].get_bottom(),
            desc_box[0].get_top(),
            color=WHITE, buff=0.06, stroke_width=2,
            max_tip_length_to_length_ratio=0.15,
        )

        desc_sub1 = make_box(
            [(r"$\mu = p_1 - p_2$", 20, WHITE, None)],
            BLUE_3B1B, ORIGIN + DOWN * 2.75, width=3.4, min_height=0.45,
        )
        desc_sub2 = make_box(
            [(r"$\sigma = \sqrt{\text{var}_1 + \text{var}_2}$", 20, WHITE, None)],
            BLUE_3B1B, ORIGIN + DOWN * 3.65, width=3.4, min_height=0.45,
        )

        # --- Branch C: Calculate Probability (right) ---
        prob_box = make_box(
            [("Calculate Probability", 18, GREEN_3B1B, BOLD)],
            GREEN_3B1B, RIGHT * 4.6 + DOWN * 1.6, width=3.2, min_height=0.55,
        )
        arr_d_prob = Arrow(
            diff_box[0].get_bottom() + RIGHT * 0.5,
            prob_box[0].get_top(),
            color=WHITE, buff=0.06, stroke_width=2,
            max_tip_length_to_length_ratio=0.15,
        )

        prob_sub1 = make_box(
            [(r"$z = \frac{\text{obs} - \mu}{\sigma}$", 20, WHITE, None)],
            GREEN_3B1B, RIGHT * 4.6 + DOWN * 2.85, width=3.2, min_height=0.55,
        )
        prob_sub2 = make_box(
            [("normalcdf", 18, GREEN_3B1B, BOLD)],
            GREEN_3B1B, RIGHT * 4.6 + DOWN * 3.75, width=3.2, min_height=0.45,
        )

        # ---- Animate Branch A ----
        self.play(Create(arr_d_cond), run_time=0.3)
        self.play(FadeIn(cond_box), run_time=0.4)
        arr_cond1 = connect(cond_box, cond_sub1, YELLOW_3B1B)
        self.play(Create(arr_cond1), FadeIn(cond_sub1), run_time=0.5)
        arr_cond2 = connect(cond_sub1, cond_sub2, YELLOW_3B1B)
        self.play(Create(arr_cond2), FadeIn(cond_sub2), run_time=0.5)
        self.wait(0.3)

        # ---- Animate Branch B ----
        self.play(Create(arr_d_desc), run_time=0.3)
        self.play(FadeIn(desc_box), run_time=0.4)
        arr_desc1 = connect(desc_box, desc_sub1, BLUE_3B1B)
        self.play(Create(arr_desc1), FadeIn(desc_sub1), run_time=0.5)
        arr_desc2 = connect(desc_sub1, desc_sub2, BLUE_3B1B)
        self.play(Create(arr_desc2), FadeIn(desc_sub2), run_time=0.5)
        self.wait(0.3)

        # ---- Animate Branch C ----
        self.play(Create(arr_d_prob), run_time=0.3)
        self.play(FadeIn(prob_box), run_time=0.4)
        arr_prob1 = connect(prob_box, prob_sub1, GREEN_3B1B)
        self.play(Create(arr_prob1), FadeIn(prob_sub1), run_time=0.5)
        arr_prob2 = connect(prob_sub1, prob_sub2, GREEN_3B1B)
        self.play(Create(arr_prob2), FadeIn(prob_sub2), run_time=0.5)
        self.wait(0.6)

        # ==================== HOLD the full map briefly ====================
        self.wait(1.0)

        # ==================== TRANSITION: fade map, show formula summary ====================
        all_map = VGroup(
            pop1, pop2, arr_p1_s, arr_p2_s,
            samples_box, arr_s_d, diff_box,
            arr_d_cond, cond_box, arr_cond1, cond_sub1, arr_cond2, cond_sub2,
            arr_d_desc, desc_box, arr_desc1, desc_sub1, arr_desc2, desc_sub2,
            arr_d_prob, prob_box, arr_prob1, prob_sub1, arr_prob2, prob_sub2,
        )
        self.play(FadeOut(all_map), FadeOut(title), run_time=0.6)

        # ==================== FORMULA REFERENCE ====================
        ref_title = Text(
            "Formula Reference", font_size=32,
            color=TEAL_3B1B, weight=BOLD,
        )

        formula1_label = Text("Mean:", font_size=22, color=YELLOW_3B1B)
        formula1_math = MathTex(
            r"\mu_{\hat{p}_1 - \hat{p}_2} = p_1 - p_2",
            font_size=28, color=WHITE,
        )
        formula1 = VGroup(formula1_label, formula1_math).arrange(RIGHT, buff=0.3)

        formula2_label = Text("Std Dev:", font_size=22, color=YELLOW_3B1B)
        formula2_math = MathTex(
            r"\sigma_{\hat{p}_1 - \hat{p}_2} = \sqrt{"
            r"\frac{p_1(1-p_1)}{n_1} + \frac{p_2(1-p_2)}{n_2}}",
            font_size=28, color=WHITE,
        )
        formula2 = VGroup(formula2_label, formula2_math).arrange(RIGHT, buff=0.3)

        formula_group = VGroup(ref_title, formula1, formula2).arrange(DOWN, buff=0.35)
        formula_group.move_to(UP * 0.8)

        ref_rect = SurroundingRectangle(
            formula_group, color=TEAL_3B1B, buff=0.35,
            corner_radius=0.15, stroke_width=3,
        )

        self.play(
            LaggedStart(
                Write(ref_title),
                Write(formula1_label), Write(formula1_math),
                Write(formula2_label), Write(formula2_math),
                lag_ratio=0.25,
            ),
            run_time=2.5,
        )
        self.play(Create(ref_rect), run_time=0.5)
        self.wait(1.0)

        # ==================== FINAL INSIGHT ====================
        insight_text = Text(
            "Variances ALWAYS add", font_size=34,
            color=YELLOW_3B1B, weight=BOLD,
        )
        insight_text2 = Text(
            "even for differences!", font_size=30,
            color=YELLOW_3B1B,
        )
        insight_group = VGroup(insight_text, insight_text2).arrange(DOWN, buff=0.15)
        insight_group.next_to(ref_rect, DOWN, buff=0.6)

        insight_rect = SurroundingRectangle(
            insight_group, color=PINK_3B1B, buff=0.25,
            corner_radius=0.12, stroke_width=3,
        )

        self.play(
            Write(insight_text), run_time=0.8,
        )
        self.play(
            Write(insight_text2), run_time=0.6,
        )
        self.play(Create(insight_rect), run_time=0.5)
        self.wait(2.5)

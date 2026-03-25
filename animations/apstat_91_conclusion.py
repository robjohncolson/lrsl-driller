"""
Conclusion logic: Is the observed slope consistent with the population model?
Show distribution, mark 7.79, conclude the 1995 model is no longer valid.

Render:
manim -qm --format=mp4 animations/apstat_91_conclusion.py SimulationConclusion
"""
from manim import *
import random

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class SimulationConclusion(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        title = Text("Drawing a Conclusion", font_size=38, weight=BOLD)
        title.to_edge(UP, buff=0.35)
        subtitle = Text(
            "Is the observed slope consistent with the model?",
            font_size=22, color=YELLOW_3B1B,
        )
        subtitle.next_to(title, DOWN, buff=0.16)

        # --- Mini sampling distribution (compact, upper area) ---
        nl = NumberLine(
            x_range=[6, 20, 2],
            length=9.5,
            include_numbers=True,
            font_size=18,
            color=GRAY_B,
        )
        nl.move_to(UP * 0.6)

        rng = random.Random(99)
        sim_slopes = [rng.gauss(13.3, 1.5) for _ in range(150)]

        bin_width = 0.6
        bins = {}
        for s in sim_slopes:
            b = round(s / bin_width) * bin_width
            b = max(7.0, min(19.5, b))
            bins[b] = bins.get(b, 0) + 1

        dot_radius = 0.055
        dot_spacing = dot_radius * 2.2
        all_dots = VGroup()
        for b_val, count in sorted(bins.items()):
            for row in range(count):
                dot = Dot(
                    point=nl.n2p(b_val) + UP * (dot_spacing * (row + 1)),
                    radius=dot_radius,
                    color=TEAL_3B1B,
                    fill_opacity=0.6,
                )
                all_dots.add(dot)

        # Observed slope marker
        obs_dot = Dot(
            point=nl.n2p(7.79) + UP * 0.13,
            radius=0.11, color=PINK_3B1B,
        )
        obs_line = DashedLine(
            nl.n2p(7.79) + DOWN * 0.15,
            nl.n2p(7.79) + UP * 2.0,
            color=PINK_3B1B, stroke_width=2.5,
        )
        obs_tag = Text(
            "7.79", font_size=20, color=PINK_3B1B, weight=BOLD,
        )
        obs_tag.next_to(obs_line, UP, buff=0.06)

        # --- Logic chain boxes (bottom) ---
        step_data = [
            ("Probability of getting b\u2081 = 7.79\nfrom this model?", YELLOW_3B1B),
            ("P \u2248 0  \u2014  Extremely unlikely", PINK_3B1B),
            ("The 1995 model is no longer\nvalid for 2019 data.", GREEN_3B1B),
        ]

        step_groups = VGroup()
        for text, col in step_data:
            box = RoundedRectangle(
                corner_radius=0.15, width=10.0, height=0.8,
                stroke_color=col, stroke_width=3,
            )
            box.set_fill(col, opacity=0.07)
            label = Text(text, font_size=22, color=WHITE, line_spacing=0.85)
            label.move_to(box.get_center())
            step_groups.add(VGroup(box, label))

        step_groups.arrange(DOWN, buff=0.18)
        step_groups.shift(DOWN * 2.1)

        # Arrows between steps
        arrows = VGroup()
        for i in range(len(step_groups) - 1):
            arr = Arrow(
                step_groups[i].get_bottom(),
                step_groups[i + 1].get_top(),
                buff=0.08, color=GRAY_B, stroke_width=2.5,
            )
            arrows.add(arr)

        # --- Animations ---
        self.play(Write(title), FadeIn(subtitle, shift=UP * 0.2), run_time=1.0)

        # Distribution
        self.play(Create(nl), run_time=0.5)
        self.play(
            LaggedStart(*[FadeIn(d, scale=0.4) for d in all_dots], lag_ratio=0.005),
            run_time=1.5,
        )

        # Mark observed slope
        self.play(
            Create(obs_line), FadeIn(obs_dot, scale=1.5),
            FadeIn(obs_tag, shift=DOWN * 0.1),
            run_time=0.8,
        )

        # Logic chain
        for i, grp in enumerate(step_groups):
            anims = [DrawBorderThenFill(grp[0]), Write(grp[1])]
            if i > 0:
                anims.append(GrowArrow(arrows[i - 1]))
            self.play(*anims, run_time=1.0)

        self.wait(1.8)

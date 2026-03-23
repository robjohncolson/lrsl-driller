"""
Show null and alternative hypotheses for both homogeneity and independence tests.

Render:
manim -qm --format=mp4 animations/apstat_85_state_hypotheses.py StateHypotheses
"""
from manim import *

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class StateHypotheses(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        title = Text("Stating Hypotheses", font_size=38, weight=BOLD)
        title.to_edge(UP, buff=0.35)
        subtitle = Text(
            "Homogeneity and Independence use the same structure",
            font_size=22,
            color=YELLOW_3B1B,
        )
        subtitle.next_to(title, DOWN, buff=0.16)

        # --- Homogeneity section ---
        hom_label = Text(
            "Homogeneity", font_size=28, color=BLUE_3B1B, weight=BOLD,
        )
        hom_label.shift(UP * 1.15 + LEFT * 3.2)

        hom_h0_box = RoundedRectangle(
            corner_radius=0.15, width=11.0, height=0.75,
            stroke_color=BLUE_3B1B, stroke_width=3,
        )
        hom_h0_box.set_fill(BLUE_3B1B, opacity=0.06)
        hom_h0_box.shift(UP * 0.5)

        hom_h0_label = Text("H\u2080:", font_size=26, color=TEAL_3B1B, weight=BOLD)
        hom_h0_text = Text(
            "There is no difference in the distribution of [variable]",
            font_size=24, color=WHITE,
        )
        hom_h0_row = VGroup(hom_h0_label, hom_h0_text).arrange(RIGHT, buff=0.2)
        hom_h0_row.move_to(hom_h0_box.get_center())

        hom_ha_box = RoundedRectangle(
            corner_radius=0.15, width=11.0, height=0.75,
            stroke_color=PINK_3B1B, stroke_width=3,
        )
        hom_ha_box.set_fill(PINK_3B1B, opacity=0.06)
        hom_ha_box.next_to(hom_h0_box, DOWN, buff=0.2)

        hom_ha_label = Text("H\u2090:", font_size=26, color=PINK_3B1B, weight=BOLD)
        hom_ha_text = Text(
            "There is a difference in the distribution of [variable]",
            font_size=24, color=WHITE,
        )
        hom_ha_row = VGroup(hom_ha_label, hom_ha_text).arrange(RIGHT, buff=0.2)
        hom_ha_row.move_to(hom_ha_box.get_center())

        hom_detail = Text(
            "across the populations",
            font_size=20, color=GRAY_B,
        )
        hom_detail.next_to(hom_ha_box, DOWN, buff=0.12)

        # --- Independence section ---
        ind_label = Text(
            "Independence", font_size=28, color=GREEN_3B1B, weight=BOLD,
        )
        ind_label.shift(DOWN * 1.15 + LEFT * 3.1)

        ind_h0_box = RoundedRectangle(
            corner_radius=0.15, width=11.0, height=0.75,
            stroke_color=GREEN_3B1B, stroke_width=3,
        )
        ind_h0_box.set_fill(GREEN_3B1B, opacity=0.06)
        ind_h0_box.shift(DOWN * 1.8)

        ind_h0_label = Text("H\u2080:", font_size=26, color=TEAL_3B1B, weight=BOLD)
        ind_h0_text = Text(
            "There is no association between [var1] and [var2]",
            font_size=24, color=WHITE,
        )
        ind_h0_row = VGroup(ind_h0_label, ind_h0_text).arrange(RIGHT, buff=0.2)
        ind_h0_row.move_to(ind_h0_box.get_center())

        ind_ha_box = RoundedRectangle(
            corner_radius=0.15, width=11.0, height=0.75,
            stroke_color=PINK_3B1B, stroke_width=3,
        )
        ind_ha_box.set_fill(PINK_3B1B, opacity=0.06)
        ind_ha_box.next_to(ind_h0_box, DOWN, buff=0.2)

        ind_ha_label = Text("H\u2090:", font_size=26, color=PINK_3B1B, weight=BOLD)
        ind_ha_text = Text(
            "There is an association between [var1] and [var2]",
            font_size=24, color=WHITE,
        )
        ind_ha_row = VGroup(ind_ha_label, ind_ha_text).arrange(RIGHT, buff=0.2)
        ind_ha_row.move_to(ind_ha_box.get_center())

        ind_detail = Text(
            "in the population of interest",
            font_size=20, color=GRAY_B,
        )
        ind_detail.next_to(ind_ha_box, DOWN, buff=0.12)

        # --- animations ---
        self.play(Write(title), FadeIn(subtitle, shift=UP * 0.2), run_time=1.0)

        # Homogeneity
        self.play(FadeIn(hom_label, shift=RIGHT * 0.15), run_time=0.6)
        self.play(
            DrawBorderThenFill(hom_h0_box),
            Write(hom_h0_label), Write(hom_h0_text),
            run_time=1.4,
        )
        self.play(
            DrawBorderThenFill(hom_ha_box),
            Write(hom_ha_label), Write(hom_ha_text),
            run_time=1.4,
        )
        self.play(FadeIn(hom_detail, shift=UP * 0.1), run_time=0.5)

        # Independence
        self.play(FadeIn(ind_label, shift=RIGHT * 0.15), run_time=0.6)
        self.play(
            DrawBorderThenFill(ind_h0_box),
            Write(ind_h0_label), Write(ind_h0_text),
            run_time=1.4,
        )
        self.play(
            DrawBorderThenFill(ind_ha_box),
            Write(ind_ha_label), Write(ind_ha_text),
            run_time=1.4,
        )
        self.play(FadeIn(ind_detail, shift=UP * 0.1), run_time=0.5)
        self.wait(1.8)

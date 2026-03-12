"""
Cluster Sample Definition (AP Stats Unit 3, Topic 3.3c)

Defines cluster sampling and shows how it differs from stratified.

Run with: manim -qm --format=mp4 cluster_sample_definition.py ClusterSampleDefinition
"""
from manim import *

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
RED_3B1B = "#EF4444"
ORANGE_3B1B = "#F97316"


class ClusterSampleDefinition(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        title = Text("Cluster Sampling", font_size=42, weight=BOLD)
        title.to_edge(UP, buff=0.3)
        self.play(Write(title))
        self.wait(0.3)

        defn = Text(
            "Randomly select entire GROUPS (clusters), then survey ALL members.",
            font_size=20, color=ManimColor(TEAL_3B1B),
        )
        defn.next_to(title, DOWN, buff=0.3)
        self.play(Write(defn), run_time=0.4)
        self.wait(0.3)

        # ========== VISUAL: 6 CLASSROOMS ==========
        classrooms = VGroup()
        colors = [BLUE_D, BLUE_C, BLUE_B, TEAL_A, TEAL_B, TEAL_C]
        labels_text = ["Room 1", "Room 2", "Room 3", "Room 4", "Room 5", "Room 6"]

        for i in range(6):
            room = VGroup()
            rect = Rectangle(width=1.4, height=0.9, color=colors[i], fill_opacity=0.2)
            dots = VGroup(*[
                Dot(radius=0.06, color=colors[i]).move_to(
                    rect.get_center() + LEFT * 0.3 + RIGHT * (j % 3) * 0.25 + UP * 0.12 + DOWN * (j // 3) * 0.25
                ) for j in range(6)
            ])
            label = Text(labels_text[i], font_size=12, color=GREY_B)
            label.next_to(rect, DOWN, buff=0.05)
            room.add(rect, dots, label)
            classrooms.add(room)

        classrooms.arrange_in_grid(rows=2, cols=3, buff=0.4)
        classrooms.next_to(defn, DOWN, buff=0.4)
        self.play(FadeIn(classrooms), run_time=0.6)
        self.wait(0.3)

        # ========== RANDOMLY SELECT 2 CLUSTERS ==========
        step = Text("Randomly select 2 clusters:", font_size=18, color=ManimColor(GREEN_3B1B))
        step.next_to(classrooms, DOWN, buff=0.25)
        self.play(Write(step), run_time=0.3)

        selected = [1, 4]  # Rooms 2 and 5
        for i, room in enumerate(classrooms):
            if i in selected:
                self.play(
                    room[0].animate.set_stroke(ManimColor(GREEN_3B1B), width=4).set_fill(ManimColor(GREEN_3B1B), opacity=0.3),
                    run_time=0.3,
                )
            else:
                self.play(room.animate.set_opacity(0.25), run_time=0.2)

        self.wait(0.5)

        result = Text(
            "Survey ALL students in Rooms 2 and 5 (12 students total).",
            font_size=17, color=GREY_B,
        )
        result.next_to(step, DOWN, buff=0.15)
        self.play(Write(result), run_time=0.3)
        self.wait(0.5)

        # ========== KEY POINT ==========
        closing = Text(
            "Cluster: ALL from SOME groups (practical when groups are spread out).",
            font_size=18, color=YELLOW_3B1B,
        )
        closing.to_edge(DOWN, buff=0.4)
        closing_box = SurroundingRectangle(closing, color=ManimColor(YELLOW_3B1B), buff=0.12, corner_radius=0.1)
        self.play(Write(closing), Create(closing_box), run_time=0.5)
        self.wait(1.5)

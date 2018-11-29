import networkx as nx
import regex as re
from math import sqrt
from itertools import combinations


class GCodeParser:
    """ This class is used to generate networkx graphs from gcode files """
    def __init__(self) -> None:
        self.p_pen_up = re.compile("M03 S525")
        self.p_pen_down = re.compile("M03 S975")
        self.p_lin_int = re.compile("G[01] X([-+]?[0-9]*\.?[0-9]*) Y([-+]?[0-9]*\.?[0-9]*)")

    def graph_from_gcode(self, filename) -> nx.Graph:
        """ Constructs a simple complete graph with vertices at each pen up/pen down position.
            Arguments:
                filename (String): relative path to gcode file
            Return:
                (nx.Graph): complete graph with coordinate tuples (x, y) as vertices with attributes:
                    'pen_down' (bool): edge attribute specifying pen position

        """
        f = open(filename, "r")
        if f.mode == "r":
            lines = f.readlines()
            return self.parse_gcode(lines)
        else:
            raise Exception("Something went wrong reading file {}".format(filename))

    def parse_gcode(self, lines) -> nx.Graph:
        drawing_graph = self.get_solid_graph(lines)
        complete_graph = complete_graph_from_nodes(drawing_graph.nodes())
        for e in drawing_graph.edges:
            complete_graph.edges[e]['pen_down'] = True
        return complete_graph

    def get_solid_graph(self, lines) -> nx.Graph:
        g = nx.Graph()

        previous_node = None
        segment_start_node = 0
        for l in lines:
            if self.p_pen_down.match(l):
                if previous_node is None:
                    raise Exception("file contains pen down message before positioning")
                segment_start_node = previous_node
                g.add_node(previous_node)
                continue
            if self.p_pen_up.match(l):
                if previous_node is not None:
                    g.add_node(previous_node)
                    g.add_edge(previous_node, segment_start_node, pen_down=True, d=distance(
                        previous_node,
                        segment_start_node
                    ))
                continue
            lin_int_match = self.p_lin_int.match(l)
            if lin_int_match:
                x = float(lin_int_match.group(1))
                y = float(lin_int_match.group(2))
                previous_node = x, y

        return g


def complete_graph_from_nodes(nodes) -> nx.Graph:
    """ Creates a complete graph with the given nodes """
    g = nx.Graph()
    g.add_nodes_from(nodes)
    if len(nodes) > 1:
        edges = combinations(nodes, 2)
        g.add_edges_from(edges, pen_down=False)
    return g


def distance(p1, p2) -> float:
    """ Calculate the linear distance between two points represented by points """
    return sqrt((p1[0]-p2[0])**2 + (p1[1]-p2[1])**2)

